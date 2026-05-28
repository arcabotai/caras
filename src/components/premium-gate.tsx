"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { PremiumBadge } from "./premium-badge";

interface PremiumGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  className?: string;
  contentClassName?: string;
}

export function PremiumGate({
  children,
  fallback,
  showUpgradePrompt = true,
  className,
  contentClassName,
}: PremiumGateProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading] = useState(false);

  // Still loading session
  if (status === "loading") {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="h-8 bg-white/10 rounded-lg mb-2" />
        <div className="h-4 bg-white/5 rounded w-3/4" />
      </div>
    );
  }

  // Not logged in - show custom fallback or redirect to login
  if (!session) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className={cn("p-6 rounded-2xl bg-white/5 border border-white/10 text-center", className)}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">Inicia sesión para continuar</h3>
        <p className="text-gray-400 text-sm mb-4">
          Esta función está disponible para miembros premium. Inicia sesión o
          regístrate para continuar.
        </p>
        <button
          onClick={() => router.push("/auth/login?callbackUrl=/premium")}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition-opacity"
        >
          Iniciar Sesión
        </button>
      </div>
    );
  }

  // User is premium - show content
  // Note: In a real app, you'd check the actual premium status from the session
  // For now, we'll check if the user is logged in and assume they might be premium
  // You could extend the session callback to include isPremium

  return (
    <div className={cn(className)}>
      {children}
    </div>
  );
}

interface PremiumUpgradePromptProps {
  title?: string;
  description?: string;
  features?: string[];
  compact?: boolean;
  className?: string;
  onUpgrade?: () => void;
}

export function PremiumUpgradePrompt({
  title = "Desbloquea esta función",
  description = "Esta función está disponible exclusivamente para miembros premium.",
  features = [
    "Mensajes ilimitados",
    "Personajes premium exclusivos",
    "Acceso anticipado a funciones",
    "Sin publicidad",
  ],
  compact = false,
  className,
  onUpgrade,
}: PremiumUpgradePromptProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      router.push("/premium");
    }
  };

  if (compact) {
    return (
      <div
        className={cn(
          "p-4 rounded-xl bg-gradient-to-r from-purple-900/40 to-pink-900/20 border border-purple-500/30",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <PremiumBadge variant="small" />
          <div className="flex-1">
            <p className="text-sm font-medium">{title}</p>
          </div>
          <button
            onClick={handleUpgrade}
            className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-sm font-medium hover:bg-white/20 transition-colors"
          >
            Mejorar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-6 rounded-2xl bg-gradient-to-b from-purple-900/40 to-pink-900/20 border border-purple-500/30",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            <PremiumBadge variant="small" showText={false} />
          </div>
          <p className="text-gray-400 text-sm mb-4">{description}</p>
          
          <ul className="space-y-2 mb-6">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-gray-300">
                <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleUpgrade}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Obtener Premium
            </button>
            <a
              href="/billing"
              className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 transition-colors text-center"
            >
              Ver mis planes
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PremiumLimitBannerProps {
  type: "messages" | "characters" | "features";
  current?: number;
  limit: number;
  onUpgrade?: () => void;
  className?: string;
}

export function PremiumLimitBanner({
  type,
  current = 0,
  limit,
  onUpgrade,
  className,
}: PremiumLimitBannerProps) {
  const router = useRouter();
  const percentage = Math.min((current / limit) * 100, 100);

  const messages = {
    title: "Límite de mensajes alcanzado",
    description: `Has usado ${current} de ${limit} mensajes hoy.`,
    cta: "Desbloquea mensajes ilimitados",
  };

  const characters = {
    title: "Límite de personajes alcanzado",
    description: `Has creado ${current} de ${limit} personajes.`,
    cta: "Crea personajes ilimitados",
  };

  const features = {
    title: "Función premium",
    description: "Esta función está disponible solo para miembros premium.",
    cta: "Actualizar a Premium",
  };

  const content = type === "messages" ? messages : type === "characters" ? characters : features;

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      router.push("/premium");
    }
  };

  return (
    <div className={cn("p-4 rounded-xl bg-amber-500/10 border border-amber-500/30", className)}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-medium text-amber-200">{content.title}</p>
          <p className="text-sm text-amber-300/70">{content.description}</p>
        </div>
      </div>

      {type === "messages" && (
        <div className="mb-3">
          <div className="h-2 bg-amber-500/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      <button
        onClick={handleUpgrade}
        className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:opacity-90 transition-opacity"
      >
        {content.cta}
      </button>
    </div>
  );
}
