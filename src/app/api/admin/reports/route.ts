import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reports, characters, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// GET - List all pending reports (admin only)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  // Check admin
  const [user] = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, session.user.id));

  if (!user?.isAdmin) {
    return Response.json(
      { error: "Acceso denegado. Se requiere rol de administrador." },
      { status: 403 }
    );
  }

  // Fetch pending reports with character and reporter info
  const allReports = await db
    .select({
      id: reports.id,
      reason: reports.reason,
      details: reports.details,
      status: reports.status,
      createdAt: reports.createdAt,
      characterId: reports.characterId,
      reporterId: reports.reporterId,
      characterName: characters.name,
      characterCreatorId: characters.creatorId,
      characterShortDesc: characters.shortDesc,
      reporterEmail: users.email,
      reporterName: users.name,
    })
    .from(reports)
    .leftJoin(characters, eq(reports.characterId, characters.id))
    .leftJoin(users, eq(reports.reporterId, users.id))
    .orderBy(desc(reports.createdAt));

  return Response.json({ reports: allReports });
}