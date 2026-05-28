import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { characterReactions, characters } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET - Get reaction count and whether the current user has reacted
export async function GET(
  req: NextRequest,
  { params }: RouteContext
) {
  const { id } = await params;

  // Get total reaction count for this character
  const [{ count: totalCount }] = await db
    .select({ count: count() })
    .from(characterReactions)
    .where(eq(characterReactions.characterId, id));

  // Check if current user has reacted
  const session = await auth();
  let userHasReacted = false;
  let userReactionId: string | null = null;

  if (session?.user?.id) {
    const [userReaction] = await db
      .select({ id: characterReactions.id })
      .from(characterReactions)
      .where(
        and(
          eq(characterReactions.characterId, id),
          eq(characterReactions.userId, session.user.id)
        )
      );
    if (userReaction) {
      userHasReacted = true;
      userReactionId = userReaction.id;
    }
  }

  return Response.json({
    count: Number(totalCount),
    userHasReacted,
    userReactionId,
  });
}

// POST - Toggle reaction (add if not exists, remove if exists)
export async function POST(
  req: NextRequest,
  { params }: RouteContext
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Debes iniciar sesión para dar like" }, { status: 401 });
  }

  const { id } = await params;

  // Verify character exists
  const [character] = await db
    .select({ id: characters.id })
    .from(characters)
    .where(eq(characters.id, id));

  if (!character) {
    return Response.json({ error: "Personaje no encontrado" }, { status: 404 });
  }

  // Check if user already reacted
  const [existingReaction] = await db
    .select({ id: characterReactions.id })
    .from(characterReactions)
    .where(
      and(
        eq(characterReactions.characterId, id),
        eq(characterReactions.userId, session.user.id)
      )
    );

  if (existingReaction) {
    // Remove reaction (toggle off)
    await db
      .delete(characterReactions)
      .where(eq(characterReactions.id, existingReaction.id));

    // Get updated count
    const [{ count: newCount }] = await db
      .select({ count: count() })
      .from(characterReactions)
      .where(eq(characterReactions.characterId, id));

    return Response.json({ reacted: false, count: Number(newCount) });
  } else {
    // Add reaction (toggle on)
    const [newReaction] = await db
      .insert(characterReactions)
      .values({
        userId: session.user.id,
        characterId: id,
      })
      .returning();

    // Get updated count
    const [{ count: newCount }] = await db
      .select({ count: count() })
      .from(characterReactions)
      .where(eq(characterReactions.characterId, id));

    return Response.json({ reacted: true, count: Number(newCount), reactionId: newReaction.id });
  }
}