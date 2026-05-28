import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { characters, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const VALID_ACTIONS = ["flag", "remove"] as const;
type ActionType = typeof VALID_ACTIONS[number];

// PATCH - Flag or remove a character (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  // Admin check
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

  const { id } = await params;

  const [character] = await db
    .select()
    .from(characters)
    .where(eq(characters.id, id));

  if (!character) {
    return Response.json({ error: "Personaje no encontrado" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { action } = body;

  if (!action || typeof action !== "string" || !VALID_ACTIONS.includes(action as ActionType)) {
    return Response.json(
      { error: `Acción inválida. Valores permitidos: ${VALID_ACTIONS.join(", ")}` },
      { status: 400 }
    );
  }

  const actionType = action as ActionType;

  if (actionType === "flag") {
    const [updated] = await db
      .update(characters)
      .set({ isFlagged: !character.isFlagged })
      .where(eq(characters.id, id))
      .returning();

    return Response.json({
      success: true,
      message: updated?.isFlagged ? "Personaje marcado" : "Marcado removido",
      character: updated,
    });
  }

  if (actionType === "remove") {
    await db.delete(characters).where(eq(characters.id, id));
    return Response.json({ success: true, message: "Personaje eliminado" });
  }

  return Response.json({ error: "Acción desconocida" }, { status: 400 });
}
