import { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { characters } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

// Static pages for the sitemap
const staticPages: MetadataRoute.Sitemap = [
  {
    url: "https://talkielatam.com",
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1,
  },
  {
    url: "https://talkielatam.com/discover",
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  },
  {
    url: "https://talkielatam.com/create",
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    url: "https://talkielatam.com/auth/login",
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    url: "https://talkielatam.com/auth/register",
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    url: "https://talkielatam.com/premium",
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  },
];

// Fetch top 100 characters by chat count for dynamic sitemap entries
async function getTopCharacters() {
  try {
    const topCharacters = await db
      .select({
        id: characters.id,
        name: characters.name,
        updatedAt: characters.updatedAt,
        isPremium: characters.isPremium,
      })
      .from(characters)
      .where(eq(characters.isPublic, true))
      .orderBy(desc(characters.chatCount))
      .limit(100);

    return topCharacters.map((char) => ({
      url: `https://talkielatam.com/chat/${char.id}`,
      lastModified: char.updatedAt,
      changeFrequency: "weekly" as const,
      priority: char.isPremium ? 0.6 : 0.7,
    }));
  } catch (error) {
    console.error("Error fetching characters for sitemap:", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const characterPages = await getTopCharacters();

  return [...staticPages, ...characterPages];
}