"use client";

import type { Metadata } from "next";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CharacterCard } from "@/components/character-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, Filter, ArrowLeft, Loader2 } from "lucide-react";
import { categories, sortOptions } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Descubrir Personajes",
  description:
    "Explora miles de personajes de IA creados por nuestra comunidad. Filtra por categoría: anime, videojuegos, ficción, películas y más.",
  keywords: [
    "descubrir personajes",
    "personajes AI",
    "buscar personajes",
    "anime",
    "videojuegos",
    "ficción",
    "chat AI",
    "explorar",
  ],
  openGraph: {
    title: "Descubrir Personajes | Talkie LATAM",
    description:
      "Explora miles de personajes de IA creados por nuestra comunidad. Filtra por categoría: anime, videojuegos, ficción y más.",
    images: [{ url: "/api/og?title=Descubrir%20Personajes", width: 1200, height: 630 }],
  },
};

export default function DiscoverPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [sort, setSort] = useState(searchParams.get("sort") || "popular");

  useEffect(() => {
    fetchCharacters();
  }, [category, sort]);

  const fetchCharacters = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      if (sort) params.set("sort", sort);

      const res = await fetch(`/api/characters?${params}`);
      const data = await res.json();
      setCharacters(data.characters || []);
    } catch (error) {
      console.error("Error fetching characters:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/discover?search=${encodeURIComponent(search.trim())}`);
      // Filter locally for demo
      setCharacters(
        characters.filter(
          (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.shortDesc.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  };

  return (
    <div className="min-h-screen bg-black page-enter">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg sm:text-xl font-bold text-white">Descubrir</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search & Filters */}
        <div className="space-y-4 mb-8">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              type="text"
              placeholder="Buscar personajes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl"
            />
          </form>

          <div className="flex items-center gap-4 flex-wrap overflow-x-auto pb-2 -mb-2">
            {/* Category filter */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div className="flex gap-2 flex-wrap">
                <Badge
                  variant={category === "all" ? "default" : "outline"}
                  className={`cursor-pointer flex-shrink-0 ${
                    category === "all"
                      ? "bg-purple-600 text-white border-0"
                      : "border-white/10 text-gray-400 hover:bg-white/10"
                  }`}
                  onClick={() => setCategory("all")}
                >
                  Todos
                </Badge>
                {categories.map((cat) => (
                  <Badge
                    key={cat.id}
                    variant={category === cat.id ? "default" : "outline"}
                    className={`cursor-pointer flex-shrink-0 ${
                      category === cat.id
                        ? "bg-purple-600 text-white border-0"
                        : "border-white/10 text-gray-400 hover:bg-white/10"
                    }`}
                    onClick={() => setCategory(cat.id)}
                  >
                    {cat.emoji} {cat.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="ml-auto flex gap-2 flex-shrink-0">
              {sortOptions.map((opt) => (
                <Badge
                  key={opt.id}
                  variant={sort === opt.id ? "default" : "outline"}
                  className={`cursor-pointer flex-shrink-0 ${
                    sort === opt.id
                      ? "bg-white/10 text-white border-white/20"
                      : "border-white/10 text-gray-500 hover:bg-white/10"
                  }`}
                  onClick={() => setSort(opt.id)}
                >
                  {opt.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="space-y-6 page-enter">
            {/* Filter skeleton */}
            <FilterSkeleton />
            {/* Grid skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-children">
              {Array.from({ length: 8 }).map((_, i) => (
                <CharacterCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : characters.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No se encontraron personajes</p>
            <Button
              variant="outline"
              className="mt-4 border-white/10 text-white hover:bg-white/10"
              onClick={() => {
                setCategory("all");
                setSearch("");
                fetchCharacters();
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-children">
            {characters.map((char) => (
              <CharacterCard key={char.id} {...char} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}