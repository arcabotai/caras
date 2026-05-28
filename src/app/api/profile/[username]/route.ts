import { db } from "@/lib/db";
import { users, characters } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    // Find user by username
    const user = await db.query.users.findFirst({
      where: eq(users.name, username),
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Get user's characters (public only)
    const userCharacters = await db.query.characters.findMany({
      where: and(
        eq(characters.creatorId, user.id),
        eq(characters.isPublic, true)
      ),
      orderBy: (characters, { desc }) => [desc(characters.chatCount)],
    });

    // Calculate total reactions (sum of replyCount from all characters)
    const totalReactions = userCharacters.reduce(
      (sum, char) => sum + char.replyCount,
      0
    );

    // Return public profile data
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        isPremium: user.isPremium,
        createdAt: user.createdAt,
      },
      characters: userCharacters,
      stats: {
        charactersCreated: userCharacters.length,
        reactionsReceived: totalReactions,
      },
    });
  } catch (error) {
    console.error("Profile API error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
