import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { like, desc, eq, or } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "@/lib/utils";
import UsersClient from "./UsersClient";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const { q = "", filter = "" } = await searchParams;

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      isPremium: users.isPremium,
      isAdmin: users.isAdmin,
      messageCount: users.messageCount,
      createdAt: users.createdAt,
      whatsappNumber: users.whatsappNumber,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(200);

  const filteredUsers = allUsers.filter((u) => {
    if (q) {
      const lowerQ = q.toLowerCase();
      if (
        !u.name?.toLowerCase().includes(lowerQ) &&
        !u.email?.toLowerCase().includes(lowerQ)
      ) {
        return false;
      }
    }
    if (filter === "premium" && !u.isPremium) return false;
    if (filter === "admin" && !u.isAdmin) return false;
    if (filter === "free" && u.isPremium) return false;
    return true;
  });

  const stats = {
    total: allUsers.length,
    premium: allUsers.filter((u) => u.isPremium).length,
    admins: allUsers.filter((u) => u.isAdmin).length,
  };

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h2 className="text-2xl font-bold text-white">Usuarios</h2>
        <p className="text-muted-foreground mt-1">
          Gestiona las cuentas de los usuarios
        </p>
      </div>

      {/* Summary badges */}
      <div className="flex gap-4 flex-wrap">
        <Badge className="bg-[#7C3AED]/10 text-[#A78BFA] border-[#7C3AED]/30 px-3 py-1 text-sm">
          {stats.total} Total
        </Badge>
        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 px-3 py-1 text-sm">
          {stats.premium} Premium
        </Badge>
        <Badge className="bg-green-500/10 text-green-400 border-green-500/30 px-3 py-1 text-sm">
          {stats.admins} Admin{stats.admins !== 1 ? "es" : ""}
        </Badge>
      </div>

      {/* Users list */}
      <UsersClient
        users={filteredUsers}
        currentSearch={q}
        currentFilter={filter}
      />
    </div>
  );
}
