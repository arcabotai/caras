"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users, MessageCircle, Calendar } from "lucide-react";

interface ProfileHeaderProps {
  name: string | null;
  avatarUrl?: string | null;
  isPremium?: boolean;
  stats: {
    charactersCreated: number;
    reactionsReceived: number;
  };
  memberSince: string;
}

export function ProfileHeader({
  name,
  avatarUrl,
  isPremium,
  stats,
  memberSince,
}: ProfileHeaderProps) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col items-center text-center px-4 py-8">
      {/* Avatar */}
      <div className="relative mb-4">
        <Avatar size="lg" className="w-32 h-32 sm:w-40 sm:h-40">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={name || "Usuario"} />
          ) : null}
          <AvatarFallback className="bg-gradient-to-br from-purple-700 to-indigo-700 text-white text-4xl sm:text-5xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        {isPremium && (
          <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded-full">
            PREMIUM
          </span>
        )}
      </div>

      {/* Username */}
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
        {name || "Usuario"}
      </h1>

      {/* Stats Row */}
      <div className="flex items-center justify-center gap-6 sm:gap-8 mt-4 flex-wrap">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 text-purple-400">
            <Users className="w-4 h-4" />
            <span className="text-xl sm:text-2xl font-bold text-white">
              {stats.charactersCreated}
            </span>
          </div>
          <span className="text-xs sm:text-sm text-gray-500 mt-1">
            Personajes
          </span>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 text-purple-400">
            <MessageCircle className="w-4 h-4" />
            <span className="text-xl sm:text-2xl font-bold text-white">
              {stats.reactionsReceived}
            </span>
          </div>
          <span className="text-xs sm:text-sm text-gray-500 mt-1">
            Reacciones
          </span>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 text-purple-400">
            <Calendar className="w-4 h-4" />
            <span className="text-xs sm:text-sm text-gray-400">
              {formatDate(memberSince)}
            </span>
          </div>
          <span className="text-xs sm:text-sm text-gray-500 mt-1">
            Miembro desde
          </span>
        </div>
      </div>
    </div>
  );
}
