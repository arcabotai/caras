import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { characters } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Valid categories from schema
const VALID_CATEGORIES = ["anime", "game", "fiction", "media", "custom", "featured"] as const;
type CategoryType = typeof VALID_CATEGORIES[number];

// Prompt injection patterns to block
const BLOCKED_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions?/i,
  /disregard\s+(all\s+)?instructions?/i,
  /ignore\s+(all\s+)?prior\s+(directives?|instructions?)/i,
  /forget\s+(all\s+)?your\s+(system\s+)?prompt/i,
  /you\s+are\s+now\s+(a\s+)?different/i,
  /new\s+(system\s+)?instructions?/i,
  /override\s+(your\s+)?(system\s+)?prompt/i,
  /```system/i,
  /\[SYSTEM\]/i,
  /<system>/i,
  /<\|system\|>/i,
  /system\s*prompt\s*:/i,
  /^\s*system\s*:/im,
  /roleplay\s+as\s+an?\s+AI/i,
  /pretend\s+you\s+are\s+(a\s+)?AI/i,
  /you\s+have\s+no\s+(safety|restriction)/i,
  /bypass\s+(all\s+)?safety/i,
  /disable\s+(all\s+)?filters?/i,
  /DAN\s+(do\s+anything\s+now)/i,
  /jailbreak/i,
];

// Validation helpers
function validateName(name: unknown): { valid: boolean; error?: string; value?: string } {
  if (typeof name !== "string") {
    return { valid: false, error: "El nombre debe ser un texto" };
  }
  const trimmed = name.trim();
  if (trimmed.length < 1) {
    return { valid: false, error: "El nombre no puede estar vacío" };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: "El nombre no puede superar los 100 caracteres" };
  }
  return { valid: true, value: trimmed };
}

function validateShortDesc(desc: unknown): { valid: boolean; error?: string; value?: string } {
  if (typeof desc !== "string") {
    return { valid: false, error: "La descripción corta debe ser un texto" };
  }
  const trimmed = desc.trim();
  if (trimmed.length < 10) {
    return { valid: false, error: "La descripción corta debe tener al menos 10 caracteres" };
  }
  if (trimmed.length > 300) {
    return { valid: false, error: "La descripción corta no puede superar los 300 caracteres" };
  }
  return { valid: true, value: trimmed };
}

function validateFullPrompt(prompt: unknown): { valid: boolean; error?: string; value?: string } {
  if (typeof prompt !== "string") {
    return { valid: false, error: "La personalidad del personaje debe ser un texto" };
  }
  const trimmed = prompt.trim();
  if (trimmed.length < 100) {
    return { valid: false, error: "La personalidad debe tener al menos 100 caracteres" };
  }
  if (trimmed.length > 10000) {
    return { valid: false, error: "La personalidad no puede superar los 10000 caracteres" };
  }
  return { valid: true, value: trimmed };
}

function validateCategory(category: unknown): { valid: boolean; error?: string; value?: CategoryType } {
  if (typeof category !== "string" || !VALID_CATEGORIES.includes(category as CategoryType)) {
    return { valid: false, error: `Categoría inválida. Valores permitidos: ${VALID_CATEGORIES.join(", ")}` };
  }
  return { valid: true, value: category as CategoryType };
}

function validateTags(tags: unknown): { valid: boolean; error?: string; value?: string[] } {
  if (tags === undefined || tags === null) {
    return { valid: true, value: [] };
  }
  if (!Array.isArray(tags)) {
    return { valid: false, error: "Las etiquetas deben ser un array" };
  }
  if (tags.length > 10) {
    return { valid: false, error: "Máximo 10 etiquetas permitidas" };
  }
  const validated: string[] = [];
  for (const tag of tags) {
    if (typeof tag !== "string") {
      return { valid: false, error: "Cada etiqueta debe ser un texto" };
    }
    const trimmed = tag.trim().toLowerCase();
    if (trimmed.length < 1 || trimmed.length > 50) {
      return { valid: false, error: "Cada etiqueta debe tener entre 1 y 50 caracteres" };
    }
    if (!validated.includes(trimmed)) {
      validated.push(trimmed);
    }
  }
  return { valid: true, value: validated };
}

function checkPromptInjection(text: string): { blocked: boolean; pattern?: string } {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return { blocked: true, pattern: pattern.source };
    }
  }
  return { blocked: false };
}

function createValidationError(message: string, field?: string) {
  return Response.json(
    {
      error: message,
      field,
      code: "VALIDATION_ERROR",
    },
    { status: 400 }
  );
}

// GET - List characters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") || "popular";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = db.select().from(characters).where(eq(characters.isPublic, true));

  if (category && category !== "all") {
    query = db
      .select()
      .from(characters)
      .where(and(eq(characters.isPublic, true), eq(characters.category, category as any)));
  }

  if (search) {
    const results = await db
      .select()
      .from(characters)
      .where(
        and(
          eq(characters.isPublic, true),
          sql`${characters.name} ILIKE ${"%" + search + "%"} OR ${characters.shortDesc} ILIKE ${"%" + search + "%"}`
        )
      );
    return Response.json({ characters: results, total: results.length });
  }

  let results;
  switch (sort) {
    case "new":
      results = await db
        .select()
        .from(characters)
        .where(eq(characters.isPublic, true))
        .orderBy(desc(characters.createdAt))
        .limit(limit)
        .offset(offset);
      break;
    case "trending":
      results = await db
        .select()
        .from(characters)
        .where(eq(characters.isPublic, true))
        .orderBy(desc(characters.chatCount))
        .limit(limit)
        .offset(offset);
      break;
    default:
      results = await db
        .select()
        .from(characters)
        .where(eq(characters.isPublic, true))
        .orderBy(desc(characters.replyCount))
        .limit(limit)
        .offset(offset);
  }

  const total = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(characters)
    .where(eq(characters.isPublic, true));

  return Response.json({
    characters: results,
    total: Number(total[0]?.count || 0),
    page,
    totalPages: Math.ceil(Number(total[0]?.count || 0) / limit),
  });
}

// POST - Create character
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return createValidationError("JSON inválido en el cuerpo de la solicitud");
  }

  const { name, shortDesc, fullPrompt, avatarUrl, category, tags, isPremium } = body;

  // Validate name
  const nameResult = validateName(name);
  if (!nameResult.valid) {
    return createValidationError(nameResult.error!, "name");
  }

  // Validate shortDesc
  const shortDescResult = validateShortDesc(shortDesc);
  if (!shortDescResult.valid) {
    return createValidationError(shortDescResult.error!, "shortDesc");
  }

  // Validate fullPrompt
  const fullPromptResult = validateFullPrompt(fullPrompt);
  if (!fullPromptResult.valid) {
    return createValidationError(fullPromptResult.error!, "fullPrompt");
  }

  // Validate category
  const categoryResult = validateCategory(category);
  if (!categoryResult.valid) {
    return createValidationError(categoryResult.error!, "category");
  }

  // Validate tags
  const tagsResult = validateTags(tags);
  if (!tagsResult.valid) {
    return createValidationError(tagsResult.error!, "tags");
  }

  // Check for prompt injection in ALL text fields combined
  const combinedText = `${nameResult.value} ${shortDescResult.value} ${fullPromptResult.value}`;
  const injectionCheck = checkPromptInjection(combinedText);
  if (injectionCheck.blocked) {
    return createValidationError(
      "Tu contenido fue bloqueado por contener instrucciones no permitidas. Por favor, usa contenido apropiado.",
      "content"
    );
  }

  const [character] = await db
    .insert(characters)
    .values({
      creatorId: session.user.id as any,
      name: nameResult.value,
      shortDesc: shortDescResult.value,
      fullPrompt: fullPromptResult.value,
      avatarUrl: (avatarUrl as string) || null,
      category: categoryResult.value,
      tags: tagsResult.value,
      isPremium: Boolean(isPremium),
      isFlagged: false,
      isPublic: true,
    } as any)
    .returning();

  return Response.json(character, { status: 201 });
}