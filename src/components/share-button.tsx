"use client";

import { useState, useCallback } from "react";
import { Share2, Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UseShareOptions {
  title: string;
  text: string;
  url: string;
}

interface UseShareReturn {
  share: () => Promise<void>;
  copyLink: () => Promise<void>;
  openWhatsApp: () => void;
}

function useShare({ title, text, url }: UseShareOptions): UseShareReturn {
  const share = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        // User cancelled or error — do nothing
      }
    }
  }, [title, text, url]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("¡Enlace copiado!", {
        duration: 2000,
      });
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  }, [url]);

  const openWhatsApp = useCallback(() => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      `${title} en Talkie: ${url}`
    )}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }, [title, url]);

  return { share, copyLink, openWhatsApp };
}

interface ShareButtonProps {
  characterId: string;
  characterName: string;
  shortDesc: string;
  /** Pass "chat" for /chat/[id] links, "character" for /character/[id] links */
  variant?: "chat" | "character";
  className?: string;
  /** Size variant for the trigger button */
  size?: "sm" | "md";
  /** Show label text next to icon */
  showLabel?: boolean;
}

const BASE_URL = "https://talkielatam.com";

export function ShareButton({
  characterId,
  characterName,
  shortDesc,
  variant = "chat",
  className,
  size = "md",
  showLabel = false,
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const shareUrl =
    variant === "chat"
      ? `${BASE_URL}/chat/${characterId}`
      : `${BASE_URL}/character/${characterId}`;

  const { share, copyLink, openWhatsApp } = useShare({
    title: characterName,
    text: shortDesc,
    url: shareUrl,
  });

  const handleShareClick = useCallback(async () => {
    if ("share" in navigator) {
      await share();
    } else {
      setIsOpen(true);
    }
  }, [share]);

  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const buttonPadding = size === "sm" ? "p-2" : "p-2.5";
  const labelClass = size === "sm" ? "text-xs" : "text-sm";

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger>
        <button
          type="button"
          onClick={handleShareClick}
          className={`flex items-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all duration-200 ${buttonPadding} ${className || ""}`}
          aria-label="Compartir personaje"
        >
          <Share2 className={iconSize} />
          {showLabel && (
            <span className={labelClass}>Compartir</span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="min-w-[180px] bg-gray-900 border-white/10"
      >
        <DropdownMenuItem
          onClick={copyLink}
          className="flex items-center gap-2 cursor-pointer focus:bg-white/5"
        >
          <Copy className="w-4 h-4 text-purple-400" />
          <span>Copiar enlace</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={openWhatsApp}
          className="flex items-center gap-2 cursor-pointer focus:bg-white/5"
        >
          <MessageCircle className="w-4 h-4 text-green-400" />
          <span>Compartir en WhatsApp</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { useShare };