"use client";

import { Crown, Lock } from "lucide-react";
import Link from "next/link";

interface MessageCounterProps {
  /** Number of messages used today (0-based) */
  used: number;
  /** Maximum messages (free tier: 50) */
  limit: number;
  /** Whether the user is premium */
  isPremium: boolean;
  /** Callback to refresh the counter after sending a message */
  onRefresh?: () => void;
}

function getCounterColor(used: number, limit: number): {
  bar: string;
  text: string;
  label: string;
} {
  const ratio = used / limit;
  if (ratio >= 0.82) {
    // 41–50 → red zone
    return {
      bar: "bg-red-500",
      text: "text-red-400",
      label: "Casi agotado",
    };
  }
  if (ratio >= 0.62) {
    // 31–40 → yellow zone
    return {
      bar: "bg-yellow-500",
      text: "text-yellow-400",
      label: "Mensajes limitados",
    };
  }
  // 0–30 → green zone
  return {
    bar: "bg-green-500",
    text: "text-green-400",
    label: "Mensajes disponibles",
  };
}

export function MessageCounter({ used, limit, isPremium, onRefresh }: MessageCounterProps) {
  const percentage = Math.min((used / limit) * 100, 100);
  const remaining = Math.max(limit - used, 0);

  if (isPremium) {
    return (
      <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <Crown className="w-4 h-4 text-amber-400" />
        <span className="text-sm text-amber-300 font-medium">Premium: mensajes ilimitados</span>
        <Crown className="w-4 h-4 text-amber-400" />
      </div>
    );
  }

  const { bar, text, label } = getCounterColor(used, limit);
  const showUpgradeCTA = used >= 40;

  return (
    <div className="group relative flex flex-col gap-1 py-2 px-4 rounded-xl bg-white/5 border border-white/5">
      {/* Tooltip on hover */}
      <div className="hidden group-hover:flex absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 px-3 py-2 rounded-lg bg-gray-900 border border-white/10 text-xs text-gray-300 whitespace-nowrap shadow-xl">
        <Lock className="w-3 h-3 mr-1.5 mt-0.5 text-amber-400" />
        Premium: mensajes ilimitados
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className={`${text} font-medium`}>{label}</span>
        <span className={`${text} font-bold tabular-nums`}>
          {used}&thinsp;/&thinsp;{limit}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${bar}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Upgrade CTA */}
      {showUpgradeCTA && (
        <Link
          href="/premium"
          className="mt-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-500/20"
          onClick={onRefresh}
        >
          <Crown className="w-3 h-3" />
          Obtener Premium — Mensajes ilimitados
        </Link>
      )}

      {/* Remaining count (only when close to limit) */}
      {!showUpgradeCTA && remaining <= 10 && (
        <p className="text-center text-xs text-gray-500">
          {remaining} mensaje{remaining !== 1 ? "s" : ""} restante{remaining !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
