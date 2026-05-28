import { db } from "@/lib/db";
import { users, characters, reports } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BotMessageSquare, FileWarning, Crown } from "lucide-react";

export default async function AdminOverviewPage() {
  // Fetch stats in parallel
  const [
    totalUsersResult,
    totalCharactersResult,
    openReportsResult,
    premiumUsersResult,
  ] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(characters),
    db
      .select({ count: count() })
      .from(reports)
      .where(eq(reports.status, "pending")),
    db
      .select({ count: count() })
      .from(users)
      .where(eq(users.isPremium, true)),
  ]);

  const totalUsers = totalUsersResult[0]?.count ?? 0;
  const totalCharacters = totalCharactersResult[0]?.count ?? 0;
  const openReports = openReportsResult[0]?.count ?? 0;
  const premiumUsers = premiumUsersResult[0]?.count ?? 0;

  const stats = [
    {
      title: "Total de Usuarios",
      value: totalUsers.toLocaleString("es-CL"),
      icon: Users,
      description: "Usuarios registrados",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "Total de Personajes",
      value: totalCharacters.toLocaleString("es-CL"),
      icon: BotMessageSquare,
      description: "Personajes creados",
      color: "text-[#7C3AED]",
      bg: "bg-[#7C3AED]/10",
    },
    {
      title: "Reportes Abiertos",
      value: openReports.toLocaleString("es-CL"),
      icon: FileWarning,
      description: "Reportes pendientes de revisión",
      color: openReports > 0 ? "text-yellow-400" : "text-green-400",
      bg: openReports > 0 ? "bg-yellow-500/10" : "bg-green-500/10",
    },
    {
      title: "Usuarios Premium",
      value: premiumUsers.toLocaleString("es-CL"),
      icon: Crown,
      description: "Usuarios con suscripción activa",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div>
        <h2 className="text-2xl font-bold text-white">Resumen</h2>
        <p className="text-muted-foreground mt-1">
          Estadísticas generales del sistema
        </p>
      </div>

      {/* Stats cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="bg-[#0f0a1e] border-[#7C3AED]/20"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickActionCard
            title="Revisar Reportes"
            description={`${openReports} reporte${openReports !== 1 ? "s" : ""} pendiente${openReports !== 1 ? "s" : ""}`}
            href="/admin/reports"
            hrefText="Ir a Reportes"
          />
          <QuickActionCard
            title="Gestionar Personajes"
            description="Buscar, marcar o eliminar personajes"
            href="/admin/characters"
            hrefText="Ir a Personajes"
          />
          <QuickActionCard
            title="Gestionar Usuarios"
            description="Administrar cuentas y suscripciones"
            href="/admin/users"
            hrefText="Ir a Usuarios"
          />
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  hrefText,
}: {
  title: string;
  description: string;
  href: string;
  hrefText: string;
}) {
  return (
    <Card className="bg-[#0f0a1e] border-[#7C3AED]/20">
      <CardContent className="pt-6">
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
        <a
          href={href}
          className="inline-flex items-center mt-4 text-sm font-medium text-[#A78BFA] hover:text-white transition-colors"
        >
          {hrefText} →
        </a>
      </CardContent>
    </Card>
  );
}
