"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export default function ReportDetailClient({
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
    characterAvatarUrl: string | null;
    characterCreatorId: string | null;
    characterCreatedAt: Date | null;
    reporterEmail: string | null;
    reporterName: string | null;
  };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(action: string) {
    setLoading(action);
    setError(null);

    try {
      const res = await fetch(`/api/admin/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error desconocido");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(null);
    }
  }

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
  const isPending = status === "pending";

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back button */}
      <a
        href="/admin/reports"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-white transition-colors"
      >
        ← Volver a Reportes
      </a>

      {/* Report info card */}
      <Card className="bg-[#0f0a1e] border-[#7C3AED]/20">
        <CardHeader>
          <div className="flex items-center gap-3 flex-wrap">
            <CardTitle className="text-white">Reporte</CardTitle>
            <Badge className={reasonColors[reason] ?? reasonColors.other}>
              {reasonLabels[reason] ?? reason}
            </Badge>
            <Badge className={statusColors[status] ?? statusColors.pending}>
              {statusLabels[status] ?? status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Details */}
          {report.details && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Detalles del reporte
              </p>
              <p className="text-sm text-white/80">{report.details}</p>
            </div>
          )}

          {/* Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Reportado por</p>
              <p className="text-white">
                {report.reporterName ?? report.reporterEmail ?? "Anónimo"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Fecha</p>
              <p className="text-white">
                {report.createdAt
                  ? format(report.createdAt, "dd MMM yyyy, HH:mm", "es-CL")
                  : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Character info card */}
      <Card className="bg-[#0f0a1e] border-[#7C3AED]/20">
        <CardHeader>
          <CardTitle className="text-white">Personaje Reportado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {report.characterId ? (
            <>
              <div className="flex items-center gap-3">
                {report.characterAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={report.characterAvatarUrl}
                    alt={report.characterName ?? ""}
                    className="w-12 h-12 rounded-full object-cover border border-[#7C3AED]/30"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED] text-lg font-bold">
                    {(report.characterName?.[0] ?? "?").toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-white">
                    {report.characterName ?? "—"}
                  </p>
                  {report.characterShortDesc && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {report.characterShortDesc}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">ID del personaje</p>
                  <p className="text-white/60 font-mono text-xs truncate">
                    {report.characterId}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Creado</p>
                  <p className="text-white">
                    {report.characterCreatedAt
                      ? format(report.characterCreatedAt, "dd MMM yyyy", "es-CL")
                      : "—"}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              El personaje ha sido eliminado.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Actions card */}
      {isPending && (
        <Card className="bg-[#0f0a1e] border-[#7C3AED]/20">
          <CardHeader>
            <CardTitle className="text-white">Acciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                variant="outline"
                disabled={!!loading}
                onClick={() => handleAction("dismiss")}
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                {loading === "dismiss" ? "Descartando..." : "Descartar Reporte"}
              </Button>
              <Button
                variant="outline"
                disabled={!!loading || !report.characterId}
                onClick={() => handleAction("flag")}
                className="border-yellow-600 text-yellow-400 hover:bg-yellow-900/20 hover:text-yellow-300"
              >
                {loading === "flag" ? "Marcando..." : "Marcar Personaje"}
              </Button>
              <Button
                variant="outline"
                disabled={!!loading || !report.characterId}
                onClick={() => handleAction("remove_character")}
                className="border-red-600 text-red-400 hover:bg-red-900/20 hover:text-red-300"
              >
                {loading === "remove_character" ? "Eliminando..." : "Eliminar Personaje"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              <strong>Descartar:</strong> El reporte se cierra sin acción sobre el personaje.
              {" "}<strong>Marcar:</strong> El personaje queda marcado para revisión.
              {" "}<strong>Eliminar:</strong> El personaje es eliminado permanentemente.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
