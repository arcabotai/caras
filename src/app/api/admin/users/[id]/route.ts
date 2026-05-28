import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const VALID_ACTIONS = ["toggle_premium", "toggle_admin", "delete"] as const;
type ActionType = typeof VALID_ACTIONS[number];

// PATCH - Manage user (admin only)
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

  const [targetUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, id));

  if (!targetUser) {
    return Response.json({ error: "Usuario no encontrado" }, { status: 404 });
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

  if (actionType === "toggle_premium") {
    const [updated] = await db
      .update(users)
      .set({ isPremium: !targetUser.isPremium })
      .where(eq(users.id, id))
      .returning();

    return Response.json({
      success: true,
      message: updated?.isPremium ? "Premium activado" : "Premium desactivado",
      user: updated,
    });
  }

  if (actionType === "toggle_admin") {
    // Prevent removing own admin status
    if (session.user.id === id) {
      return Response.json(
        { error: "No puedes modificar tu propio rol de administrador" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(users)
      .set({ isAdmin: !targetUser.isAdmin })
      .where(eq(users.id, id))
      .returning();

    return Response.json({
      success: true,
      message: updated?.isAdmin ? "Ahora es administrador" : "Rol de administrador removido",
      user: updated,
    });
  }

  if (actionType === "delete") {
    await db.delete(users).where(eq(users.id, id));
    return Response.json({ success: true, message: "Usuario eliminado" });
  }

  return Response.json({ error: "Acción desconocida" }, { status: 400 });
}
