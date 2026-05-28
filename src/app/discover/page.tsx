"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CharacterCard } from "@/components/character-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ArrowLeft, Loader2, X } from "lucide-react";
import { categories, sortOptions } from "@/lib/constants";

interface Suggestion {
  id: string;
  name: string;
  shortDesc: string;
}

function DiscoverInner() {
  const router = useRouter();
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("popular");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch suggestions when debounced search changes
  useEffect(() => {
    if (debouncedSearch.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`/api/characters?q=${encodeURIComponent(debouncedSearch)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.characters?.slice(0, 5) || []);
        }
      } catch {
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [debouncedSearch]);

  // Fetch characters when filters change
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
    } catch {
      setCharacters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (id: string) => {
    setShowSuggestions(false);
    setSuggestions([]);
    router.push(`/chat/${id}`);
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search)}`);
    }
  };

  const handleClear = () => {
    setSearch("");
    setDebouncedSearch("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="min-h-screen bg-black page-enter">
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
        <div className="space-y-4 mb-8">
          {/* Search input with suggestions */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Buscar personajes..."
              value={search}
              onChange={(e) => {
                const value = e.target.value;
                setSearch(value);
                if (value.trim().length >= 2) {
                  setShowSuggestions(true);
                } else {
                  setShowSuggestions(false);
                  setSuggestions([]);
                }
              }}
              onFocus={() => {
                if (search.trim().length >= 2 && suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl pr-10"
            />
            {search && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionRef}
              className="absolute left-4 right-4 mt-2 bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 max-h-80 overflow-y-auto"
              style={{ maxWidth: "calc(100% - 2rem)", width: "calc(100% - 2rem)" }}
            >
              {suggestions.map((char) => (
                <button
                  key={char.id}
                  onClick={() => handleSuggestionClick(char.id)}
                  className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">
                      {char.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{char.name}</p>
                    <p className="text-gray-400 text-sm truncate">{char.shortDesc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 flex-wrap overflow-x-auto pb-2 -mb-2">
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

        {loading ? (
          <div className="space-y-6 page-enter">
            <div className="flex items-center gap-4 flex-wrap overflow-x-auto pb-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 w-20 rounded-full skeleton-shimmer flex-shrink-0"
                />
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-children">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden">
                  <div className="h-48 skeleton-shimmer" />
                  <div className="p-4 space-y-2 bg-white/5 border border-white/10 rounded-b-2xl">
                    <div className="h-4 w-3/4 skeleton-shimmer rounded" />
                    <div className="h-3 w-1/2 skeleton-shimmer rounded" />
                  </div>
                </div>
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
                setDebouncedSearch("");
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

function DiscoverSkeleton() {
  return (
    <div className="min-h-screen bg-black page-enter">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-12 skeleton-shimmer rounded-xl" />
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-20 rounded-full skeleton-shimmer" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden">
              <div className="h-48 skeleton-shimmer" />
              <div className="p-4 space-y-2 bg-white/5 border border-white/10 rounded-b-2xl">
                <div className="h-4 w-3/4 skeleton-shimmer rounded" />
                <div className="h-3 w-1/2 skeleton-shimmer rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<DiscoverSkeleton />}>
      <DiscoverInner />
    </Suspense>
  );
}