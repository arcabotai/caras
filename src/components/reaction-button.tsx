"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface ReactionButtonProps {
  characterId: string;
  initialCount?: number;
  initialUserReacted?: boolean;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}

export function ReactionButton({
  characterId,
  initialCount = 0,
  initialUserReacted = false,
  size = "md",
  showCount = true,
}: ReactionButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const [count, setCount] = useState(initialCount);
  const [userReacted, setUserReacted] = useState(initialUserReacted);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // Fetch reaction state from server on mount
  useEffect(() => {
    if (hasFetched) return;
    setHasFetched(true);

    fetch(`/api/characters/${characterId}/reactions`)
      .then((res) => res.json())
      .then((data) => {
        setCount(data.count ?? initialCount);
        setUserReacted(data.userHasReacted ?? false);
      })
      .catch(() => {
        // Non-fatal - keep initial state
      });
  }, [characterId, hasFetched, initialCount]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      router.push("/auth/login");
      return;
    }

    if (isLoading) return;

    // Optimistic update
    const wasReacted = userReacted;
    setUserReacted(!wasReacted);
    setCount((prev) => (wasReacted ? prev - 1 : prev + 1));
    setIsLoading(true);

    try {
      const res = await fetch(`/api/characters/${characterId}/reactions`, {
        method: "POST",
      });

      if (res.status === 401) {
        // Session expired
        router.push("/auth/login");
        return;
      }

      if (!res.ok) {
        // Revert optimistic update
        setUserReacted(wasReacted);
        setCount((prev) => (wasReacted ? prev + 1 : prev - 1));
        return;
      }

      const data = await res.json();
      // Sync with server state
      setCount(data.count);
      setUserReacted(data.reacted);
    } catch {
      // Revert optimistic update on error
      setUserReacted(wasReacted);
      setCount((prev) => (wasReacted ? prev + 1 : prev - 1));
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-full
        transition-all duration-200 select-none
        ${
          userReacted
            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
            : "bg-white/10 text-gray-400 hover:bg-white/20 hover:text-gray-200"
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-95
      `}
      title={session ? (userReacted ? "Quitar like" : "Dar like") : "Inicia sesión para dar like"}
    >
      <Heart
        className={`${iconSizes[size]} transition-transform duration-200 ${
          userReacted ? "fill-current scale-110" : ""
        }`}
      />
      {showCount && (
        <span className={`${textSizes[size]} font-medium tabular-nums`}>
          {count > 0 ? count.toLocaleString("es-ES") : ""}
        </span>
      )}
    </button>
  );
}