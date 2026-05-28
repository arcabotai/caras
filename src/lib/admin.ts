import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

/**
 * Server-side admin check helper.
 * Throws a Response with 403 if the current user is not an admin.
 * Returns the current session if the user is an admin.
 */
export async function requireAdmin(): Promise<{ user: { id: string; isAdmin: boolean } }> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  if (session.user.isAdmin !== true) {
    return Response.json(
      { error: "Acceso denegado. Se requiere rol de administrador." },
      { status: 403 }
    ) as never;
  }

  return session as { user: { id: string; isAdmin: boolean } };
}

/**
 * Check if the current user is an admin without throwing/redirecting.
 * Returns the user's admin status from the database.
 */
export async function getAdminStatus(userId: string): Promise<boolean> {
  const [user] = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, userId));

  return user?.isAdmin ?? false;
}
