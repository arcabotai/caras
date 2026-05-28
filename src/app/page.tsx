import Link from "next/link";
import { CharacterCard } from "@/components/character-card";
import { HeroSection } from "@/components/hero-section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { featuredCharacters, categories } from "@/lib/constants";
import { Sparkles, Plus, Zap, Users } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Talkie LATAM</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/discover"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Descubrir
            </Link>
            <Link
              href="/create"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Crear
            </Link>
            <Link
              href="/community"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Comunidad
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                Iniciar sesión
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Crear personaje
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <HeroSection />

      {/* Featured Characters */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Badge
                variant="outline"
                className="mb-2 border-amber-500/30 text-amber-400 bg-amber-500/10"
              >
                ⭐ Destacados
              </Badge>
              <h2 className="text-3xl font-bold text-white">
                Personajes más populares
              </h2>
              <p className="text-gray-400 mt-1">
                Los favoritos de la comunidad esta semana
              </p>
            </div>
            <Link href="/discover?sort=popular">
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/10">
                Ver todos
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredCharacters.map((char) => (
              <CharacterCard key={char.id} {...char} />
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4 bg-white/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Explora por categoría
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/discover?category=${cat.id}`}
                className="group p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/30 hover:bg-purple-500/10 transition-all text-center"
              >
                <div className="text-4xl mb-3">{cat.emoji}</div>
                <div className="text-white font-medium">{cat.label}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">
            ¿Por qué Talkie LATAM?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-900/50 to-transparent border border-purple-500/20">
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Conversaciones inteligentes
              </h3>
              <p className="text-gray-400">
                IA avanzada que entiende contexto, humor y emociones. Cada
                conversación se siente única y realista.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-pink-900/50 to-transparent border border-pink-500/20">
              <div className="w-12 h-12 rounded-xl bg-pink-600/20 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Comunidad activa
              </h3>
              <p className="text-gray-400">
                Miles de personajes creados por la comunidad. Encuentra tu
                favorito o crea el tuyo.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900/50 to-transparent border border-indigo-500/20">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Hecho para LATAM
              </h3>
              <p className="text-gray-400">
                Español neutro con sabor latinoamericano. Cultura, humor y
                referencias que entienden.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/20">
            <h2 className="text-4xl font-bold text-white mb-4">
              Crea tu propio personaje
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              ¿Tienes una historia en mente? Dale vida y comparte tu personaje
              con la comunidad.
            </p>
            <Link href="/create">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8">
                <Plus className="w-5 h-5 mr-2" />
                Empezar ahora
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">Talkie LATAM</span>
            </div>
            <p className="text-gray-500 text-sm">
              © 2026 Talkie LATAM. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}