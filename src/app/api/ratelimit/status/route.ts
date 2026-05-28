import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getRateLimitStatus } from "@/lib/ratelimit";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/ratelimit/status
export async function GET(req: NextRequest) {
  let userId: string | null = null;
  try {
    const session = await auth();
    userId = session?.user?.id ?? null;
  } catch {
    // auth failed — continue with anonymous status
  }

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let user;
  try {
    user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  } catch (err) {
    console.error("[ratelimit/status] DB error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const status = await getRateLimitStatus(userId, !!user.isPremium);

  return Response.json(status);
}
