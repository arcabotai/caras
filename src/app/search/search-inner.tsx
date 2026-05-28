"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CharacterCard } from "@/components/character-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X, Loader2, TrendingUp } from "lucide-react";
import { getTrendingSearches } from "@/lib/trending";

interface Suggestion {
  id: string;
  name: string;
  shortDesc: string;
}

export function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [trending, setTrending] = useState<string[]>([]);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`/api/characters?q=${encodeURIComponent(debouncedQuery)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.characters?.slice(0, 5) || []);
        }
      } catch {
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  // Fetch search results when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setCharacters([]);
      setLoading(false);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/characters?q=${encodeURIComponent(debouncedQuery)}&limit=50`);
        if (res.ok) {
          const data = await res.json();
          setCharacters(data.characters || []);
        }
      } catch {
        setCharacters([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  // Load trending searches
  useEffect(() => {
    setTrending(getTrendingSearches());
  }, []);

  const handleClear = () => {
    setQuery("");
    setDebouncedQuery("");
    setCharacters([]);
    setSuggestions([]);
    router.push("/search");
  };

  const handleSuggestionClick = (id: string) => {
    setShowSuggestions(false);
    router.push(`/chat/${id}`);
  };

  const handleTrendingClick = (term: string) => {
    setQuery(term);
    setDebouncedQuery(term);
  };

  return (
    <div className="min-h-screen bg-black page-enter">
      <header className="border-b border-white/5 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                type="text"
                placeholder="Buscar personajes..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl pr-10"
                autoFocus
              />
              {query && (
                <button
                  onClick={handleClear}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-4 right-4 mt-2 bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 max-h-80 overflow-y-auto">
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
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="space-y-6">
            <div className="h-8 skeleton-shimmer rounded w-48" />
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
        ) : debouncedQuery && characters.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Sin resultados para &ldquo;{debouncedQuery}&rdquo;
            </h2>
            <p className="text-gray-500 mb-6">Intenta con otros términos de búsqueda</p>
            {trending.length > 0 && (
              <div className="mt-8">
                <p className="text-gray-400 mb-3 flex items-center justify-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Búsquedas populares
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {trending.slice(0, 5).map((term) => (
                    <Badge
                      key={term}
                      variant="outline"
                      className="cursor-pointer border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                      onClick={() => handleTrendingClick(term)}
                    >
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : characters.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {characters.length} resultado{characters.length !== 1 ? "s" : ""} para &ldquo;{debouncedQuery}&rdquo;
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-children">
              {characters.map((char) => (
                <CharacterCard key={char.id} {...char} />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {trending.length > 0 && (
              <div>
                <p className="text-gray-400 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium">Búsquedas populares</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {trending.map((term) => (
                    <Badge
                      key={term}
                      variant="outline"
                      className="cursor-pointer px-3 py-1.5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                      onClick={() => handleTrendingClick(term)}
                    >
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎭</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Explora personajes increíbles
              </h2>
              <p className="text-gray-500">
                Escribe el nombre del personaje que buscas
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
