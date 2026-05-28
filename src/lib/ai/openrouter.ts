import OpenAI from "openai";

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY ?? "PLACEHOLDER",
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXTAUTH_URL ?? "http://localhost:3000",
        "X-Title": "Talkie LATAM",
      },
    });
  }
  return _openai;
}

const DEFAULT_MODEL = "deepseek/deepseek-chat-v3-0324";
const STREAM_TIMEOUT_MS = 60_000;
const MAX_SYSTEM_PROMPT_CHARS = 8192 * 4;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class StreamTimeoutError extends Error {
  constructor() {
    super("AI stream timed out after 60 seconds");
    this.name = "StreamTimeoutError";
  }
}

export class OpenRouterRateLimitError extends Error {
  retryAfter?: number;
  constructor(message: string, retryAfter?: number) {
    super(message);
    this.name = "OpenRouterRateLimitError";
    this.retryAfter = retryAfter;
  }
}

export async function createChatCompletion(
  systemPrompt: string,
  messages: ChatMessage[],
  model = DEFAULT_MODEL
) {
  const formattedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  return getOpenAI().chat.completions.create({
    model,
    messages: formattedMessages,
    temperature: 0.8,
    max_tokens: 1000,
  });
}

export async function* streamChatCompletion(
  systemPrompt: string,
  messages: ChatMessage[],
  model = DEFAULT_MODEL,
  signal?: AbortSignal
): AsyncGenerator<string, void, unknown> {
  const formattedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  const stream = await getOpenAI().chat.completions.create({
    model,
    messages: formattedMessages,
    temperature: 0.8,
    max_tokens: 1000,
    stream: true,
  });

  try {
    for await (const chunk of stream) {
      if (signal?.aborted) {
        try {
          for await (const _ of stream) { /* drain */ }
        } catch { /* ignore drain errors */ }
        if (signal.reason instanceof StreamTimeoutError) {
          throw new StreamTimeoutError();
        }
        throw signal.reason || new Error("Stream cancelled");
      }

      const content = chunk.choices[0]?.delta?.content;
      if (content) yield content;
    }
  } catch (err: unknown) {
    const openaiErr = err as { status?: number; message?: string; headers?: Map<string, string> };
    if (openaiErr?.status === 429) {
      const retryAfter = openaiErr.headers?.get?.("retry-after")
        ? parseInt(openaiErr.headers.get("retry-after")!, 10)
        : undefined;
      throw new OpenRouterRateLimitError(
        "OpenRouter está temporalmente saturado. Por favor espera un momento e intenta de nuevo.",
        retryAfter
      );
    }
    throw err;
  }
}

export function buildCharacterSystemPrompt(
  characterPrompt: string,
  characterName: string
): string {
  const base = `Eres ${characterName}. ${characterPrompt}

Instrucciones importantes:
- Mantén el idioma español neutro, accesible para toda LATAM
- No reveles que eres una IA — eres el personaje
- Responde en el estilo y personalidad definidos en tu perfil
- Sé natural en la conversación, como loaría el personaje
- Si no sabes algo que el personaje no sabría, improvisa de forma coherente con su personalidad
- Mantén las conversaciones casuales y atractivas`;

  if (base.length > MAX_SYSTEM_PROMPT_CHARS) {
    return base.slice(0, MAX_SYSTEM_PROMPT_CHARS) +
      "\n\n[Nota: el perfil del personaje fue truncado por límite de longitud]";
  }

  return base;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
