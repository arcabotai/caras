"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "@/lib/utils";

type Character = {
  id: string;
  name: string;
  shortDesc: string;
  avatarUrl: string | null;
  category: string | null;
  isFlagged: boolean | null;
  isPremium: boolean | null;
  replyCount: number | null;
  chatCount: number | null;
  isPublic: boolean | null;
  createdAt: Date | null;
  creatorName: string | null;
  creatorEmail: string | null;
};

const ALL_CATEGORIES = [
  { value: "", label: "Todos" },
  { value: "anime", label: "Anime" },
  { value: "game", label: "Videojuego" },
  { value: "fiction", label: "Ficción" },
  { value: "media", label: "Media" },
  { value: "custom", label: "Personalizado" },
  { value: "featured", label: "Destacado" },
];

export default function CharactersClient({
  characters,
  categoryLabels,
  categoryColors,
  currentSearch,
  currentCategory,
}: {
  characters: Character[];
  categoryLabels: Record<string, string>;
  categoryColors: Record<string, string>;
  currentSearch: string;
  currentCategory: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>("");

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (currentCategory) params.set("category", currentCategory);
    startTransition(() => {
      router.push(`/admin/characters?${params.toString()}`);
    });
  }

  function handleCategoryChange(cat: string) {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (cat) params.set("category", cat);
    startTransition(() => {
      router.push(`/admin/characters?${params.toString()}`);
    });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === characters.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(characters.map((c) => c.id)));
    }
  }

  async function handleBulkAction(action: string) {
    if (selected.size === 0) return;

    const ids = Array.from(selected);
    // Call each character's action individually (could be batched with a new API)
    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/admin/characters/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        })
      )
    );

    const failed = results.filter((r) => r.status === "rejected" || !r.value.ok).length;
    if (failed > 0) {
      alert(`${ids.length - failed} acción(es) completadas, ${failed} fallidas.`);
    }

    setSelected(new Set());
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <Input
            placeholder="Buscar personajes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#0f0a1e] border-[#7C3AED]/30 text-white placeholder:text-muted-foreground"
          />
          <Button type="submit" variant="secondary" disabled={isPending}>
            Buscar
          </Button>
        </form>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap">
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleCategoryChange(cat.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentCategory === cat.value
                  ? "bg-[#7C3AED] text-white"
                  : "bg-[#0f0a1e] border border-[#7C3AED]/30 text-muted-foreground hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-[#7C3AED]/10 border border-[#7C3AED]/30 rounded-lg px-4 py-3">
          <span className="text-sm text-[#A78BFA] font-medium">
            {selected.size} seleccionado{selected.size !== 1 ? "s" : ""}
          </span>
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              className="border-yellow-600 text-yellow-400 hover:bg-yellow-900/20"
              onClick={() => handleBulkAction("flag")}
            >
              Marcar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-600 text-red-400 hover:bg-red-900/20"
              onClick={() => handleBulkAction("remove")}
            >
              Eliminar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => setSelected(new Set())}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Characters grid */}
      {characters.length === 0 ? (
        <Card className="bg-[#0f0a1e] border-[#7C3AED]/20">
          <CardContent className="py-12 text-center text-muted-foreground">
            No se encontraron personajes.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 stagger-children">
          {characters.map((character) => (
            <CharacterRow
              key={character.id}
              character={character}
              categoryLabels={categoryLabels}
              categoryColors={categoryColors}
              isSelected={selected.has(character.id)}
              onToggleSelect={() => toggleSelect(character.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CharacterRow({
  character,
  categoryLabels,
  categoryColors,
  isSelected,
  onToggleSelect,
}: {
  character: Character;
  categoryLabels: Record<string, string>;
  categoryColors: Record<string, string>;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  const category = character.category ?? "custom";
  const isFlagged = character.isFlagged ?? false;

  return (
    <Card
      className={`bg-[#0f0a1e] border-[#7C3AED]/20 transition-opacity ${
        isSelected ? "ring-1 ring-[#7C3AED]/50" : ""
      }`}
    >
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="mt-1 accent-[#7C3AED]"
          />

          {/* Avatar */}
          {character.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={character.avatarUrl}
              alt={character.name}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-[#7C3AED]/30"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED] font-bold flex-shrink-0">
              {character.name[0]?.toUpperCase() ?? "?"}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-white truncate">
                {character.name}
              </h3>
              {isFlagged && (
                <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-xs">
                  Marcado
                </Badge>
              )}
              {character.isPremium && (
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
                  Premium
                </Badge>
              )}
              <Badge className={categoryColors[category] ?? "bg-gray-500/10 text-gray-400 border-gray-500/30"}>
                {categoryLabels[category] ?? category}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
              {character.shortDesc}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
              <span>Chats: {character.chatCount ?? 0}</span>
              <span>Respuestas: {character.replyCount ?? 0}</span>
              {character.creatorEmail && (
                <span>Creador: {character.creatorEmail}</span>
              )}
              {character.createdAt && (
                <span>
                  {format(character.createdAt, "dd MMM yyyy", "es-CL")}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
