import { db } from "@/lib/db";
import { reports, characters, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import ReportDetailClient from "./ReportDetailClient";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export default async function ReportDetailPage({ params }: RouteContext) {
  const { id } = await params;

  const [report] = await db
    .select({
      id: reports.id,
      reason: reports.reason,
      details: reports.details,
      status: reports.status,
      createdAt: reports.createdAt,
      characterId: reports.characterId,
      reporterId: reports.reporterId,
      characterName: characters.name,
      characterShortDesc: characters.shortDesc,
      characterAvatarUrl: characters.avatarUrl,
      characterCreatorId: characters.creatorId,
      characterCreatedAt: characters.createdAt,
      reporterEmail: users.email,
      reporterName: users.name,
    })
    .from(reports)
    .leftJoin(characters, eq(reports.characterId, characters.id))
    .leftJoin(users, eq(reports.reporterId, users.id))
    .where(eq(reports.id, id));

  if (!report) {
    notFound();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">
        Detalle del Reporte
      </h2>
      <ReportDetailClient report={report} />
    </div>
  );
}
