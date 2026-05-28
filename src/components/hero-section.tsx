"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { categories } from "@/lib/constants";

export function HeroSection() {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/discover?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <section className="relative py-20 px-4 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-20 right-20 w-[300px] h-[300px] bg-indigo-600/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-20 left-20 w-[200px] h-[200px] bg-pink-600/20 rounded-full blur-[60px]" />
      </div>

      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Badge */}
        <Badge
          variant="outline"
          className="px-4 py-1.5 text-sm border-purple-500/30 bg-purple-500/10 text-purple-300"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          Para la comunidad LATAM
        </Badge>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
          Chatea con
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {" "}
            personajes
          </span>
          <br />
          únicos e increíbles
        </h1>

        {/* Subheadline */}
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Explora miles de personajes de IA. Anime, juegos, ficción, historias
          originales... o crea los tuyos propios.
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} className="max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              type="text"
              placeholder="Busca un personaje, categoría o historia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50"
            />
            <Button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 bg-purple-600 hover:bg-purple-700 text-white"
            >
              Buscar
            </Button>
          </div>
        </form>

        {/* Quick categories */}
        <div className="flex flex-wrap justify-center gap-2 pt-4">
          {categories.map((cat) => (
            <Badge
              key={cat.id}
              variant="outline"
              className="px-3 py-1.5 cursor-pointer hover:bg-white/10 border-white/10 text-gray-400 hover:text-white transition-colors"
              onClick={() => router.push(`/discover?category=${cat.id}`)}
            >
              {cat.emoji} {cat.label}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
}