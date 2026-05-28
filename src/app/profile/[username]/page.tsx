"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ProfileHeader } from "@/components/profile-header";
import { CharacterCard } from "@/components/character-card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Users } from "lucide-react";

interface Character {
  id: string;
  name: string;
  shortDesc: string;
  avatarUrl?: string | null;
  replyCount: number;
  category: string;
  isPremium?: boolean;
}

interface ProfileData {
  user: {
    id: string;
    name: string | null;
    avatarUrl?: string | null;
    isPremium?: boolean;
    createdAt: string;
  };
  characters: Character[];
  stats: {
    charactersCreated: number;
    reactionsReceived: number;
  };
}

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"personajes" | "acerca">(
    "personajes"
  );

  // Pagination
  const [page, setPage] = useState(1);
  const charactersPerPage = 8;

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(username)}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Usuario no encontrado");
        } else {
          setError("Error al cargar el perfil");
        }
        return;
      }
      const data = await res.json();
      setProfile(data);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const paginatedCharacters = profile?.characters.slice(
    0,
    page * charactersPerPage
  );
  const hasMoreCharacters =
    profile && page * charactersPerPage < profile.characters.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-black page-enter">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full skeleton-shimmer mb-4" />
            <div className="h-8 w-48 skeleton-shimmer rounded mb-2" />
            <div className="flex gap-8 mt-4">
              <div className="h-12 w-20 skeleton-shimmer rounded" />
              <div className="h-12 w-20 skeleton-shimmer rounded" />
              <div className="h-12 w-32 skeleton-shimmer rounded" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-12">
            {Array.from({ length: 4 }).map((_, i) => (
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

  if (error) {
    return (
      <div className="min-h-screen bg-black page-enter">
        <header className="border-b border-white/5 bg-black/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg sm:text-xl font-bold text-white">
              Perfil de Usuario
            </h1>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <p className="text-gray-500 text-lg">{error}</p>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="mt-4 border-white/10 text-white hover:bg-white/10"
          >
            Volver atrás
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-black page-enter">
      <header className="border-b border-white/5 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg sm:text-xl font-bold text-white">
            {profile.user.name || "Usuario"}
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4">
        <ProfileHeader
          name={profile.user.name}
          avatarUrl={profile.user.avatarUrl}
          isPremium={profile.user.isPremium}
          stats={profile.stats}
          memberSince={profile.user.createdAt}
        />

        {/* Tabs */}
        <div className="border-b border-white/10 mb-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("personajes")}
              className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === "personajes"
                  ? "text-purple-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Personajes
              {activeTab === "personajes" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("acerca")}
              className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === "acerca"
                  ? "text-purple-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Acerca de
              {activeTab === "acerca" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "personajes" ? (
          <div className="pb-12">
            {profile.characters.length === 0 ? (
              <div className="text-center py-20">
                <Users className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  Este usuario aún no ha creado personajes
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-children">
                  {paginatedCharacters?.map((char) => (
                    <CharacterCard key={char.id} {...char} />
                  ))}
                </div>

                {hasMoreCharacters && (
                  <div className="flex justify-center mt-8">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => p + 1)}
                      className="border-white/10 text-white hover:bg-white/10 px-8"
                    >
                      <Loader2 className="w-4 h-4 mr-2" />
                      Cargar más
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="pb-12 max-w-2xl mx-auto">
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-2">
                  Información del perfil
                </h2>
                <div className="space-y-4 text-gray-400">
                  <div className="flex justify-between">
                    <span>Nombre</span>
                    <span className="text-white">
                      {profile.user.name || "No definido"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Miembro desde</span>
                    <span className="text-white">
                      {new Date(
                        profile.user.createdAt
                      ).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Personajes creados</span>
                    <span className="text-white">
                      {profile.stats.charactersCreated}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reacciones recibidas</span>
                    <span className="text-white">
                      {profile.stats.reactionsReceived}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
