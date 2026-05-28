import { db } from "@/lib/db";
import { characters, users } from "@/lib/db/schema";
import { eq, like, desc, count, or } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "@/lib/utils";
import CharactersClient from "./CharactersClient";

const categoryLabels: Record<string, string> = {
  anime: "Anime",
  game: "Videojuego",
  fiction: "Ficción",
  media: "Media",
  custom: "Personalizado",
  featured: "Destacado",
};

const categoryColors: Record<string, string> = {
  anime: "bg-pink-500/10 text-pink-400 border-pink-500/30",
  game: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  fiction: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  media: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  custom: "bg-[#7C3AED]/10 text-[#A78BFA] border-[#7C3AED]/30",
  featured: "bg-amber-500/10 text-amber-400 border-amber-500/30",
};

export default async function CharactersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q = "", category = "" } = await searchParams;

  // Build where conditions
  const conditions = [];
  if (q) {
    conditions.push(
      or(
        like(characters.name, `%${q}%`),
        like(characters.shortDesc, `%${q}%`)
      )
    );
  }
  if (category) {
    conditions.push(eq(characters.category, category as typeof characters.category.enumValues[number]));
  }

  const allCharacters = await db
    .select({
      id: characters.id,
      name: characters.name,
      shortDesc: characters.shortDesc,
      avatarUrl: characters.avatarUrl,
      category: characters.category,
      isFlagged: characters.isFlagged,
      isPremium: characters.isPremium,
      replyCount: characters.replyCount,
      chatCount: characters.chatCount,
      isPublic: characters.isPublic,
      createdAt: characters.createdAt,
      creatorName: users.name,
      creatorEmail: users.email,
    })
    .from(characters)
    .leftJoin(users, eq(characters.creatorId, users.id))
    .orderBy(desc(characters.createdAt))
    .limit(200);

  const filteredCharacters = allCharacters.filter((c) => {
    if (q) {
      const lowerQ = q.toLowerCase();
      if (
        !c.name.toLowerCase().includes(lowerQ) &&
        !c.shortDesc.toLowerCase().includes(lowerQ)
      ) {
        return false;
      }
    }
    if (category && c.category !== category) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h2 className="text-2xl font-bold text-white">Personajes</h2>
        <p className="text-muted-foreground mt-1">
          Gestiona los personajes de la plataforma
        </p>
      </div>

      {/* Characters list */}
      <CharactersClient
        characters={filteredCharacters}
        categoryLabels={categoryLabels}
        categoryColors={categoryColors}
        currentSearch={q}
        currentCategory={category}
      />
    </div>
  );
}
