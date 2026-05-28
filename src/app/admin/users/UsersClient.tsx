"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "@/lib/utils";

type User = {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  isPremium: boolean | null;
  isAdmin: boolean | null;
  messageCount: number | null;
  createdAt: Date | null;
  whatsappNumber: string | null;
};

const FILTER_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "premium", label: "Premium" },
  { value: "admin", label: "Administradores" },
  { value: "free", label: "Gratuitos" },
];

export default function UsersClient({
  users,
  currentSearch,
  currentFilter,
}: {
  users: User[];
  currentSearch: string;
  currentFilter: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (currentFilter) params.set("filter", currentFilter);
    startTransition(() => {
      router.push(`/admin/users?${params.toString()}`);
    });
  }

  function handleFilterChange(f: string) {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (f) params.set("filter", f);
    startTransition(() => {
      router.push(`/admin/users?${params.toString()}`);
    });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleUserAction(
    userId: string,
    action: "toggle_premium" | "toggle_admin" | "delete"
  ) {
    if (action === "delete" && !confirm("¿Estás seguro de que quieres eliminar este usuario?")) {
      return;
    }

    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Error desconocido");
    }

    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#0f0a1e] border-[#7C3AED]/30 text-white placeholder:text-muted-foreground"
          />
          <Button type="submit" variant="secondary" disabled={isPending}>
            Buscar
          </Button>
        </form>

        {/* Filter buttons */}
        <div className="flex gap-2 flex-wrap">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleFilterChange(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentFilter === opt.value
                  ? "bg-[#7C3AED] text-white"
                  : "bg-[#0f0a1e] border border-[#7C3AED]/30 text-muted-foreground hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users list */}
      {users.length === 0 ? (
        <Card className="bg-[#0f0a1e] border-[#7C3AED]/20">
          <CardContent className="py-12 text-center text-muted-foreground">
            No se encontraron usuarios.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 stagger-children">
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              isExpanded={expanded === user.id}
              onToggleExpand={() =>
                setExpanded(expanded === user.id ? null : user.id)
              }
              onAction={handleUserAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UserRow({
  user,
  isExpanded,
  onToggleExpand,
  onAction,
}: {
  user: User;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAction: (userId: string, action: "toggle_premium" | "toggle_admin" | "delete") => Promise<void>;
}) {
  return (
    <Card className="bg-[#0f0a1e] border-[#7C3AED]/20">
      <CardContent className="pt-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user.name ?? ""}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-[#7C3AED]/30"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED] font-bold flex-shrink-0">
              {(user.name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-white truncate">
                {user.name ?? "Sin nombre"}
              </h3>
              {user.isAdmin && (
                <Badge className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">
                  Admin
                </Badge>
              )}
              {user.isPremium && (
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
                  Premium
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {user.email ?? "—"}
            </p>

            {/* Quick stats */}
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
              <span>Mensajes: {user.messageCount ?? 0}</span>
              {user.whatsappNumber && (
                <span>WhatsApp: {user.whatsappNumber}</span>
              )}
              {user.createdAt && (
                <span>
                  Creado: {format(user.createdAt, "dd MMM yyyy", "es-CL")}
                </span>
              )}
            </div>
          </div>

          {/* Expand/collapse button */}
          <button
            onClick={onToggleExpand}
            className="flex-shrink-0 text-muted-foreground hover:text-white transition-colors px-2 py-1 rounded"
          >
            {isExpanded ? "▲" : "▼"}
          </button>
        </div>

        {/* Expanded actions */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-[#7C3AED]/20 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-amber-600 text-amber-400 hover:bg-amber-900/20"
              onClick={() => onAction(user.id, "toggle_premium")}
            >
              {user.isPremium ? "Quitar Premium" : "Dar Premium"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-green-600 text-green-400 hover:bg-green-900/20"
              onClick={() => onAction(user.id, "toggle_admin")}
            >
              {user.isAdmin ? "Quitar Admin" : "Hacer Admin"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-600 text-red-400 hover:bg-red-900/20"
              onClick={() => onAction(user.id, "delete")}
            >
              Eliminar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
