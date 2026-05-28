"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { ReactionButton } from "./reaction-button";
import { ShareButton } from "@/components/share-button";

interface CharacterCardProps {
  id: string;
  name: string;
  shortDesc: string;
  avatarUrl?: string | null;
  replyCount: number;
  category: string;
  isPremium?: boolean;
  reactionCount?: number;
}

const categoryColors: Record<string, string> = {
  anime: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  game: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  fiction: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  media: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  custom: "bg-green-500/20 text-green-400 border-green-500/30",
  featured: "bg-violet-500/20 text-violet-400 border-violet-500/30",
};

export function CharacterCard({
  id,
  name,
  shortDesc,
  avatarUrl,
  replyCount,
  category,
  isPremium,
  reactionCount,
}: CharacterCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10 border border-white/5 bg-black/40 backdrop-blur-sm overflow-hidden">
      <div className="relative h-48 overflow-hidden">
        <Link href={`/chat/${id}`} className="block w-full h-full">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-purple-700 text-2xl">{initials}</AvatarFallback>
              </Avatar>
            </div>
          )}
        </Link>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        {isPremium && (
          <Badge className="absolute top-3 right-14 bg-amber-500/90 text-black border-0 text-xs font-bold px-2 flex items-center gap-1">
            <span>🔒</span> PREMIUM
          </Badge>
        )}
        {/* Share button overlay */}
        <div
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <ShareButton
            characterId={id}
            characterName={name}
            shortDesc={shortDesc}
            variant="chat"
            size="sm"
          />
        </div>
        <Link href={`/chat/${id}`} className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-bold text-lg leading-tight">{name}</h3>
        </Link>
      </div>
      <Link href={`/chat/${id}`}>
        <CardContent className="p-4">
          <p className="text-gray-400 text-sm line-clamp-2 mb-3">{shortDesc}</p>
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className={`text-xs ${categoryColors[category] || categoryColors.custom}`}
            >
              {category.toUpperCase()}
            </Badge>
            <div className="flex items-center gap-2">
              <ReactionButton characterId={id} initialCount={reactionCount ?? 0} size="sm" />
              <div className="flex items-center gap-1 text-gray-500 text-xs">
                <MessageCircle className="w-3 h-3" />
                <span>{replyCount.toLocaleString("es-ES")}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}