import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { characters, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

/**
 * Check if user is an admin
 */
async function isUserAdmin(userId: string): Promise<boolean> {
  const [user] = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, userId));
  return user?.isAdmin ?? false;
}

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

// Validation helpers (same as in parent route.ts)
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

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET - Get single character
export async function GET(
  req: NextRequest,
  { params }: RouteContext
) {
  const { id } = await params;

  const [character] = await db
    .select()
    .from(characters)
    .where(eq(characters.id, id));

  if (!character) {
    return Response.json(
      { error: "Personaje no encontrado", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  // If character is not public, only owner or admin can view
  const session = await auth();
  const isAdmin = session?.user?.id ? await isUserAdmin(session.user.id) : false;
  if (!character.isPublic && session?.user?.id !== character.creatorId && !isAdmin) {
    return Response.json(
      { error: "No tienes permisos para ver este personaje", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  return Response.json(character);
}

// PUT - Update character (owner only)
export async function PUT(
  req: NextRequest,
  { params }: RouteContext
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  // Get existing character
  const [existing] = await db
    .select()
    .from(characters)
    .where(eq(characters.id, id));

  if (!existing) {
    return Response.json(
      { error: "Personaje no encontrado", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  // Check ownership or admin
  const isAdmin = await isUserAdmin(session.user.id);
  if (existing.creatorId !== session.user.id && !isAdmin) {
    return Response.json(
      { error: "Solo el creador puede editar este personaje", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return createValidationError("JSON inválido en el cuerpo de la solicitud");
  }

  const { name, shortDesc, fullPrompt, avatarUrl, category, tags, isPremium, isPublic } = body;

  // Build update object with validations
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (name !== undefined) {
    const result = validateName(name);
    if (!result.valid) return createValidationError(result.error!, "name");
    updates.name = result.value;
  }

  if (shortDesc !== undefined) {
    const result = validateShortDesc(shortDesc);
    if (!result.valid) return createValidationError(result.error!, "shortDesc");
    updates.shortDesc = result.value;
  }

  if (fullPrompt !== undefined) {
    const result = validateFullPrompt(fullPrompt);
    if (!result.valid) return createValidationError(result.error!, "fullPrompt");
    updates.fullPrompt = result.value;
  }

  if (category !== undefined) {
    const result = validateCategory(category);
    if (!result.valid) return createValidationError(result.error!, "category");
    updates.category = result.value;
  }

  if (tags !== undefined) {
    const result = validateTags(tags);
    if (!result.valid) return createValidationError(result.error!, "tags");
    updates.tags = result.value;
  }

  if (avatarUrl !== undefined) {
    updates.avatarUrl = avatarUrl ? String(avatarUrl) : null;
  }

  if (isPremium !== undefined) {
    updates.isPremium = Boolean(isPremium);
  }

  if (isPublic !== undefined) {
    // Only admins can change visibility
    if (!isAdmin) {
      return createValidationError("Solo los administradores pueden cambiar la visibilidad", "isPublic");
    }
    updates.isPublic = Boolean(isPublic);
  }

  // Check for prompt injection in any text fields being updated
  const fieldsToCheck = [name, shortDesc, fullPrompt].filter(Boolean).join(" ");
  if (fieldsToCheck) {
    const injectionCheck = checkPromptInjection(fieldsToCheck);
    if (injectionCheck.blocked) {
      return createValidationError(
        "Tu contenido fue bloqueado por contener instrucciones no permitidas. Por favor, usa contenido apropiado.",
        "content"
      );
    }
  }

  // Perform update
  const [updated] = await db
    .update(characters)
    .set(updates)
    .where(eq(characters.id, id))
    .returning();

  return Response.json(updated);
}

// DELETE - Delete character (owner only)
export async function DELETE(
  req: NextRequest,
  { params }: RouteContext
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  // Get existing character
  const [existing] = await db
    .select()
    .from(characters)
    .where(eq(characters.id, id));

  if (!existing) {
    return Response.json(
      { error: "Personaje no encontrado", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  // Check ownership or admin
  const isAdmin = await isUserAdmin(session.user.id);
  if (existing.creatorId !== session.user.id && !isAdmin) {
    return Response.json(
      { error: "Solo el creador puede eliminar este personaje", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  // Delete character (cascade will handle related records)
  await db.delete(characters).where(eq(characters.id, id));

  return Response.json({ success: true, message: "Personaje eliminado" });
}
