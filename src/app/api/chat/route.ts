import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { messages, chatSessions, characters, users, characterMemories } from "@/lib/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { checkRateLimit } from "@/lib/ratelimit";
import {
  buildCharacterSystemPrompt,
  streamChatCompletion,
  StreamTimeoutError,
  OpenRouterRateLimitError,
} from "@/lib/ai/openrouter";
import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

// Configurable chat history limit via env (default: 20)
const CHAT_HISTORY_LIMIT = parseInt(process.env.CHAT_HISTORY_LIMIT ?? "20", 10);

const ERROR_MESSAGE_FALLBACK =
  "Lo siento, hubo un error técnico. Por favor intenta de nuevo.";
const ERROR_MESSAGE_RATE_LIMIT =
  "El servicio de IA está temporalmente saturado. Por favor espera unos segundos e intenta de nuevo.";

// ─── POST /api/chat ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return jsonError("Unauthorized", 401);
  }

  let body: { characterId?: string; message?: string; sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const { characterId, message, sessionId } = body;

  if (!characterId || !message?.trim()) {
    return jsonError("Missing required fields: characterId and message", 400);
  }

  // Get user
  let user;
  try {
    user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  } catch (err) {
    console.error("[chat] DB error fetching user:", err);
    return jsonError("Error interno del servidor", 500);
  }
  if (!user) return jsonError("User not found", 404);

  // Verify character exists
  const character = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
  });
  if (!character) return jsonError("Character not found", 404);

  // ─── Premium character gating ──────────────────────────────────────────────
  if (character.isPremium && !user.isPremium) {
    return Response.json(
      {
        error:
          "Este personaje es exclusivo para usuarios Premium. ¡Actualiza para chatear con él!",
        code: "PREMIUM_CHARACTER_REQUIRED",
      },
      { status: 403 }
    );
  }

  // ─── Rate limit check (skip for premium users) ────────────────────────────
  const rateLimitResult = await checkRateLimit(userId, !!user.isPremium);
  if (!rateLimitResult.success) {
    const resetDate = new Date(rateLimitResult.reset * 1000);
    const hoursLeft = Math.max(1, Math.ceil((resetDate.getTime() - Date.now()) / 3_600_000));
    return Response.json(
      {
        error: `Límite de mensajes diarios alcanzado. ¡Actualiza a Premium para mensajes ilimitados!`,
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: rateLimitResult.reset,
        retryAfterHours: hoursLeft,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          "X-RateLimit-Premium": String(!!user.isPremium),
          "Retry-After": String(rateLimitResult.reset),
        },
      }
    );
  }

  // ─── Get or create chat session ────────────────────────────────────────────
  let chatSession;
  try {
    chatSession = sessionId
      ? await db.query.chatSessions.findFirst({
          where: and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)),
        })
      : null;

    if (!chatSession) {
      const [newSession] = await db
        .insert(chatSessions)
        .values({ userId, characterId })
        .returning();
      chatSession = newSession;
    }
  } catch (err) {
    console.error("[chat] DB error with session:", err);
    return jsonError("Error interno del servidor", 500);
  }

  // Get message history (most recent first, then reverse for chronological order)
  let history: (typeof messages.$inferSelect)[] = [];
  try {
    history = await db.query.messages.findMany({
      where: eq(messages.sessionId, chatSession.id),
      orderBy: [desc(messages.createdAt)],
      limit: CHAT_HISTORY_LIMIT,
    });
  } catch (err) {
    console.error("[chat] DB error fetching history:", err);
    history = []; // Non-fatal: continue without history
  }

  // Generate stable message IDs for deduplication
  const userMessageId = uuidv4();
  const assistantMessageId = uuidv4();

  // Save user message with error handling
  try {
    await db.insert(messages).values({
      id: userMessageId,
      sessionId: chatSession.id,
      role: "user",
      content: message.trim(),
    });
  } catch (err) {
    console.error("[chat] DB error saving user message:", err);
    return jsonError("Error interno del servidor", 500);
  }

  // Update user message count (fire-and-forget with error handling)
  db.update(users)
    .set({ messageCount: user.messageCount + 1, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .catch((err) => console.error("[chat] DB error updating message count:", err));

  // Build system prompt
  const systemPrompt = buildCharacterSystemPrompt(character.fullPrompt, character.name);

  // Get conversation history for AI (chronological order)
  const chatHistory = history
    .reverse()
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  // Stream response with timeout
  const encoder = new TextEncoder();
  const abortController = new AbortController();
  const streamId = uuidv4();

  // 60-second timeout
  const timeoutHandle = setTimeout(() => {
    abortController.abort(new StreamTimeoutError());
  }, 60_000);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullResponse = "";

        for await (const chunk of streamChatCompletion(
          systemPrompt,
          chatHistory,
          undefined,
          abortController.signal
        )) {
          fullResponse += chunk;
          controller.enqueue(encoder.encode(chunk));
        }

        clearTimeout(timeoutHandle);

        // Save assistant message
        try {
          await db.insert(messages).values({
            id: assistantMessageId,
            sessionId: chatSession!.id,
            role: "assistant",
            content: fullResponse,
          });

          // Update character reply count
          await db
            .update(characters)
            .set({ replyCount: character.replyCount + 1, updatedAt: new Date() })
            .where(eq(characters.id, characterId));
        } catch (dbErr) {
          console.error("[chat] DB error saving assistant message:", dbErr);
          // Still close stream — don't leak; emit error event
          emitSSE(controller, encoder, "error", {
            type: "db_error",
            message: ERROR_MESSAGE_FALLBACK,
            streamId,
          });
          controller.close();
          return;
        }

        controller.close();
      } catch (err) {
        clearTimeout(timeoutHandle);
        console.error("[chat] Stream error:", err);

        let userMessage = ERROR_MESSAGE_FALLBACK;

        if (err instanceof OpenRouterRateLimitError) {
          userMessage = ERROR_MESSAGE_RATE_LIMIT;
          emitSSE(controller, encoder, "rate_limit", {
            type: "rate_limit",
            message: userMessage,
            streamId,
          });
        } else if (err instanceof StreamTimeoutError) {
          userMessage = "La respuesta tardó demasiado. Por favor intenta de nuevo.";
          emitSSE(controller, encoder, "timeout", {
            type: "timeout",
            message: userMessage,
            streamId,
          });
        } else {
          // Try to save error message to DB
          emitSSE(controller, encoder, "error", {
            type: "stream_error",
            message: userMessage,
            streamId,
          });
        }

        // Save error message to DB (non-blocking, errors logged)
        db.insert(messages)
          .values({
            id: assistantMessageId,
            sessionId: chatSession!.id,
            role: "assistant",
            content: userMessage,
          })
          .catch((dbErr) =>
            console.error("[chat] DB error saving error fallback message:", dbErr)
          );

        try {
          controller.close();
        } catch {
          /* already closed or errored */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Stream-Id": streamId,
      "X-RateLimit-Remaining": String(rateLimitResult.remaining),
      "X-RateLimit-Premium": String(rateLimitResult.isPremium),
    },
  });
}

// ─── GET /api/chat ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return jsonError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return jsonError("Missing required query parameter: sessionId", 400);
  }

  // Verify session belongs to user
  const session = await db.query.chatSessions.findFirst({
    where: and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)),
  });
  if (!session) return jsonError("Session not found", 404);

  // Fetch messages
  let msgs;
  try {
    msgs = await db.query.messages.findMany({
      where: eq(messages.sessionId, sessionId),
      orderBy: [asc(messages.createdAt)],
    });
  } catch (err) {
    console.error("[chat] DB error fetching messages:", err);
    return jsonError("Error interno del servidor", 500);
  }

  // Fetch character info
  const character = await db.query.characters.findFirst({
    where: eq(characters.id, session.characterId),
  });

  return Response.json({
    session: {
      id: session.id,
      characterId: session.characterId,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    },
    character: character
      ? {
          id: character.id,
          name: character.name,
          avatarUrl: character.avatarUrl,
          shortDesc: character.shortDesc,
        }
      : null,
    messages: msgs.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    })),
  });
}

// ─── DELETE /api/chat ────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return jsonError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return jsonError("Missing required query parameter: sessionId", 400);
  }

  // Verify session belongs to user
  const session = await db.query.chatSessions.findFirst({
    where: and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)),
  });
  if (!session) return jsonError("Session not found", 404);

  try {
    // Cascade delete: messages are deleted via ON DELETE CASCADE
    await db.delete(chatSessions).where(eq(chatSessions.id, sessionId));
  } catch (err) {
    console.error("[chat] DB error deleting session:", err);
    return jsonError("Error interno del servidor", 500);
  }

  return Response.json({ success: true, sessionId });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

/**
 * Emit a named SSE event on the controller.
 */
function emitSSE(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  eventName: string,
  data: Record<string, unknown>
) {
  try {
    controller.enqueue(encoder.encode(`event: ${eventName}\n`));
    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
    );
  } catch {
    /* controller already closed — ignore */
  }
}

async function getUserId(req: NextRequest): Promise<string | null> {
  try {
    const session = await auth();
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

// ─── POST /api/chat/feedback ────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return jsonError("Unauthorized", 401);

  let body: { messageId?: string; helpful?: boolean };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const { messageId, helpful } = body;

  if (!messageId || typeof helpful !== "boolean") {
    return jsonError("Missing required fields: messageId and helpful (boolean)", 400);
  }

  // Verify the message exists and belongs to a session owned by the user
  const message = await db.query.messages.findFirst({
    where: eq(messages.id, messageId),
  });

  if (!message) return jsonError("Message not found", 404);

  // Verify session ownership via chatSessions
  const session = await db.query.chatSessions.findFirst({
    where: and(
      eq(chatSessions.id, message.sessionId),
      eq(chatSessions.userId, userId)
    ),
  });

  if (!session) return jsonError("Message not found or access denied", 404);

  // Store feedback in characterMemories table (no schema change needed)
  const feedbackContent = JSON.stringify({
    type: "feedback",
    messageId,
    sessionId: message.sessionId,
    helpful,
    createdAt: new Date().toISOString(),
  });

  try {
    await db.insert(characterMemories).values({
      id: uuidv4(),
      characterId: session.characterId,
      sessionId: session.id,
      content: feedbackContent,
    });
  } catch (err) {
    console.error("[chat/feedback] DB error:", err);
    return jsonError("Error interno del servidor", 500);
  }

  return Response.json({ success: true, messageId, helpful });
}
