import { db } from "@/lib/db";
import { reports, characters, users } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "@/lib/utils";

const reasonLabels: Record<string, string> = {
  inappropriate: "Inapropiado",
  spam: "Spam",
  copyright: "Copyright",
  other: "Otro",
};

const reasonColors: Record<string, string> = {
  inappropriate: "bg-red-500/10 text-red-400 border-red-500/30",
  spam: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  copyright: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  other: "bg-gray-500/10 text-gray-400 border-gray-500/30",
};

export default async function ReportsPage() {
  // Fetch all reports with character and reporter info
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
      characterShortDesc: characters.shortDesc,
      characterCreatorId: characters.creatorId,
      reporterEmail: users.email,
      reporterName: users.name,
    })
    .from(reports)
    .leftJoin(characters, eq(reports.characterId, characters.id))
    .leftJoin(users, eq(reports.reporterId, users.id))
    .orderBy(desc(reports.createdAt));

  const pendingReports = allReports.filter((r) => r.status === "pending");
  const resolvedReports = allReports.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div>
        <h2 className="text-2xl font-bold text-white">Reportes</h2>
        <p className="text-muted-foreground mt-1">
          Revisa y gestiona los reportes de contenido
        </p>
      </div>

      {/* Summary badges */}
      <div className="flex gap-4 flex-wrap">
        <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 px-3 py-1 text-sm">
          {pendingReports.length} Pendiente{pendingReports.length !== 1 ? "s" : ""}
        </Badge>
        <Badge className="bg-green-500/10 text-green-400 border-green-500/30 px-3 py-1 text-sm">
          {resolvedReports.filter((r) => r.status === "dismissed").length} Descartado{resolvedReports.filter((r) => r.status === "dismissed").length !== 1 ? "s" : ""}
        </Badge>
        <Badge className="bg-red-500/10 text-red-400 border-red-500/30 px-3 py-1 text-sm">
          {resolvedReports.filter((r) => r.status === "actioned").length} Actionado{resolvedReports.filter((r) => r.status === "actioned").length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Reports list */}
      {allReports.length === 0 ? (
        <Card className="bg-[#0f0a1e] border-[#7C3AED]/20">
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay reportes en este momento.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 stagger-children">
          {allReports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCard({
  report,
}: {
  report: {
    id: string;
    reason: string | null;
    details: string | null;
    status: string | null;
    createdAt: Date | null;
    characterId: string | null;
    reporterId: string | null;
    characterName: string | null;
    characterShortDesc: string | null;
    characterCreatorId: string | null;
    reporterEmail: string | null;
    reporterName: string | null;
  };
}) {
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    dismissed: "bg-gray-500/10 text-gray-400 border-gray-500/30",
    actioned: "bg-red-500/10 text-red-400 border-red-500/30",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    dismissed: "Descartado",
    actioned: "Actionado",
  };

  const reason = report.reason ?? "other";
  const status = report.status ?? "pending";

  return (
    <Card className="bg-[#0f0a1e] border-[#7C3AED]/20">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Character info */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-white truncate">
                {report.characterName ?? "Personaje eliminado"}
              </h3>
              <Badge className={reasonColors[reason] ?? reasonColors.other}>
                {reasonLabels[reason] ?? reason}
              </Badge>
              <Badge className={statusColors[status] ?? statusColors.pending}>
                {statusLabels[status] ?? status}
              </Badge>
            </div>

            {report.characterShortDesc && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                {report.characterShortDesc}
              </p>
            )}

            {report.details && (
              <p className="text-sm text-muted-foreground/80 mt-2 line-clamp-2">
                {report.details}
              </p>
            )}

            {/* Meta info */}
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
              {report.reporterEmail && (
                <span>
                  Reportado por: <span className="text-white">{report.reporterEmail}</span>
                </span>
              )}
              {report.createdAt && (
                <span>
                  {format(report.createdAt, "dd MMM yyyy, HH:mm", "es-CL")}
                </span>
              )}
            </div>
          </div>

          {/* Action button */}
          <Link
            href={`/admin/reports/${report.id}`}
            className="flex-shrink-0 px-4 py-2 rounded-lg bg-[#7C3AED]/20 text-[#A78BFA] text-sm font-medium hover:bg-[#7C3AED]/30 transition-colors"
          >
            Revisar
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
