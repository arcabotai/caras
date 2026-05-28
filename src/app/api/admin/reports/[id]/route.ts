import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reports, characters, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// Valid resolutions
const VALID_ACTIONS = ["dismiss", "remove_character", "flag"] as const;
type ActionType = typeof VALID_ACTIONS[number];

// PATCH - Resolve a report (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  // Check admin
  const [adminUser] = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, session.user.id));

  if (!adminUser?.isAdmin) {
    return Response.json(
      { error: "Acceso denegado. Se requiere rol de administrador." },
      { status: 403 }
    );
  }

  const { id: reportId } = await params;

  // Find the report
  const [report] = await db
    .select()
    .from(reports)
    .where(eq(reports.id, reportId));

  if (!report) {
    return Response.json(
      { error: "Reporte no encontrado" },
      { status: 404 }
    );
  }

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { error: "JSON inválido" },
      { status: 400 }
    );
  }

  const { action } = body;

  // Validate action
  if (!action || typeof action !== "string" || !VALID_ACTIONS.includes(action as ActionType)) {
    return Response.json(
      { error: `Acción inválida. Valores permitidos: ${VALID_ACTIONS.join(", ")}` },
      { status: 400 }
    );
  }

  const actionType = action as ActionType;

  if (actionType === "dismiss") {
    // Mark report as dismissed, do nothing to character
    const [updated] = await db
      .update(reports)
      .set({ status: "dismissed" })
      .where(eq(reports.id, reportId))
      .returning();

    return Response.json({
      success: true,
      message: "Reporte descartado",
      report: updated,
    });
  }

  if (actionType === "flag") {
    // Mark report as actioned and flag the character
    if (!report.characterId) {
      return Response.json(
        { error: "No se puede marcar: el personaje ya no existe" },
        { status: 400 }
      );
    }

    const [, [updated]] = await Promise.all([
      db
        .update(reports)
        .set({ status: "actioned" })
        .where(eq(reports.id, reportId)),
      db
        .update(characters)
        .set({ isFlagged: true })
        .where(eq(characters.id, report.characterId))
        .returning(),
    ]);

    return Response.json({
      success: true,
      message: "Personaje marcado para revisión",
      report: { ...report, status: "actioned" },
      character: updated,
    });
  }

  if (actionType === "remove_character") {
    // Mark report as actioned and delete the character (cascade handles related data)
    if (!report.characterId) {
      return Response.json(
        { error: "No se puede eliminar: el personaje ya no existe" },
        { status: 400 }
      );
    }

    await Promise.all([
      db
        .update(reports)
        .set({ status: "actioned" })
        .where(eq(reports.id, reportId)),
      db
        .delete(characters)
        .where(eq(characters.id, report.characterId)),
    ]);

    return Response.json({
      success: true,
      message: "Personaje eliminado",
      report: { ...report, status: "actioned" },
    });
  }

  // Should never reach here due to validation
  return Response.json(
    { error: "Acción desconocida" },
    { status: 400 }
  );
}