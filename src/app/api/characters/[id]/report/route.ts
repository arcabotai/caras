import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reports, characters, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest } from "next/server";
import { reportReasonEnum } from "@/lib/db/schema";

// Valid report reasons
const VALID_REASONS = ["inappropriate", "spam", "copyright", "other"] as const;
type ReportReason = typeof VALID_REASONS[number];

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

// POST - Submit a report for a character
export async function POST(
  req: NextRequest,
  { params }: RouteContext
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { error: "Debes iniciar sesión para reportar" },
      { status: 401 }
    );
  }

  const { id: characterId } = await params;

  // Verify character exists
  const [character] = await db
    .select({ id: characters.id })
    .from(characters)
    .where(eq(characters.id, characterId));

  if (!character) {
    return Response.json(
      { error: "Personaje no encontrado" },
      { status: 404 }
    );
  }

  // Parse and validate body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { error: "JSON inválido" },
      { status: 400 }
    );
  }

  const { reason, details } = body;

  // Validate reason
  if (!reason || typeof reason !== "string" || !VALID_REASONS.includes(reason as ReportReason)) {
    return Response.json(
      {
        error: `Motivo inválido. Valores permitidos: ${VALID_REASONS.join(", ")}`,
      },
      { status: 400 }
    );
  }

  // Validate details (optional, max 1000 chars)
  if (details !== undefined && details !== null) {
    if (typeof details !== "string") {
      return Response.json(
        { error: "Los detalles deben ser texto" },
        { status: 400 }
      );
    }
    if (details.length > 1000) {
      return Response.json(
        { error: "Los detalles no pueden superar los 1000 caracteres" },
        { status: 400 }
      );
    }
  }

  // Check for duplicate report (same user, same character, still pending)
  const [existingReport] = await db
    .select({ id: reports.id })
    .from(reports)
    .where(
      and(
        eq(reports.reporterId, session.user.id),
        eq(reports.characterId, characterId),
        eq(reports.status, "pending")
      )
    );

  if (existingReport) {
    return Response.json(
      { error: "Ya has reportado este personaje. Estamos revisando tu reporte." },
      { status: 409 }
    );
  }

  // Create the report
  const [newReport] = await db
    .insert(reports)
    .values({
      reporterId: session.user.id,
      characterId,
      reason: reason as ReportReason,
      details: details ? String(details).trim() : null,
      status: "pending",
    })
    .returning();

  return Response.json(
    { success: true, report: newReport },
    { status: 201 }
  );
}