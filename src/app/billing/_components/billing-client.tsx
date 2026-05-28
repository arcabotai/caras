"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

interface SubscriptionData {
  isPremium: boolean;
  subscriptionStatus: "free" | "active" | "canceled" | "past_due";
  planType: "monthly" | "annual" | null;
  stripeCustomerId: string | null;
}

interface BillingClientProps {
  subscriptionData: SubscriptionData;
  userId: string;
}

export function BillingClient({ subscriptionData, userId }: BillingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [isLoadingCancel, setIsLoadingCancel] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    if (success) {
      toast.success("¡Suscripción activada con éxito!");
      router.replace("/billing");
    }
    if (canceled) {
      toast.info("La compra fue cancelada.");
      router.replace("/billing");
    }
  }, [success, canceled, router]);

  const handleOpenPortal = async () => {
    setIsLoadingPortal(true);
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Error al abrir el portal");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Portal error:", error);
      toast.error("Error al procesar la solicitud");
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsLoadingCancel(true);
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Error al cancelar");
        return;
      }

      if (data.url) {
        // Add cancel parameter to the portal URL
        const cancelUrl = new URL(data.url);
        cancelUrl.searchParams.set("return_path", "/billing?canceled=true");
        window.location.href = cancelUrl.toString();
      }
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error("Error al procesar la solicitud");
    } finally {
      setIsLoadingCancel(false);
      setShowCancelConfirm(false);
    }
  };

  const handleUpgradeToAnnual = async () => {
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "annual", provider: "stripe" }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Error al procesar");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      toast.error("Error al procesar la solicitud");
    }
  };

  const getPlanDisplayName = () => {
    if (!subscriptionData.isPremium) return "Gratis";
    if (subscriptionData.planType === "annual") return "Premium Anual";
    if (subscriptionData.planType === "monthly") return "Premium Mensual";
    return "Premium";
  };

  const getStatusDisplay = () => {
    switch (subscriptionData.subscriptionStatus) {
      case "active":
        return { text: "Activo", color: "text-green-400", bg: "bg-green-500/20" };
      case "canceled":
        return { text: "Cancelado", color: "text-gray-400", bg: "bg-gray-500/20" };
      case "past_due":
        return { text: "Pago pendiente", color: "text-amber-400", bg: "bg-amber-500/20" };
      default:
        return { text: "Inactivo", color: "text-gray-400", bg: "bg-gray-500/20" };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="min-h-screen bg-[#1A1033] text-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al inicio
          </a>
          <h1 className="text-3xl font-bold">Facturación</h1>
          <p className="text-gray-400 mt-2">
            Gestiona tu suscripción y preferencias de pago
          </p>
        </div>

        {/* Current Plan Card */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Plan Actual</h2>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold">{getPlanDisplayName()}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.bg} ${statusDisplay.color}`}>
                  {statusDisplay.text}
                </span>
              </div>
            </div>
            {subscriptionData.isPremium && (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>
            )}
          </div>

          {!subscriptionData.isPremium && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-900/40 to-pink-900/20 border border-purple-500/30 mb-6">
              <p className="text-gray-300 text-sm mb-4">
                Mejora tu experiencia con Premium y desbloquea mensajes ilimitados,
                personajes exclusivos y más.
              </p>
              <a
                href="/premium"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:opacity-90 transition-opacity"
              >
                Ver planes Premium
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          )}
        </div>

        {/* Premium Benefits Reminder (if on monthly) */}
        {subscriptionData.isPremium && subscriptionData.planType === "monthly" && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900/40 to-pink-900/20 border border-purple-500/30 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">¿Buscas ahorrar?</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Cambia a Premium Anual y ahorra $20 al año (equivalente a $3.33/mes).
                </p>
                <button
                  onClick={handleUpgradeToAnnual}
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 transition-colors"
                >
                  Cambiar a Anual
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {subscriptionData.isPremium && (
          <div className="space-y-4">
            {/* Manage Subscription */}
            {subscriptionData.stripeCustomerId && (
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="font-semibold mb-2">Gestionar Suscripción</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Accede al portal de Stripe para actualizar tu método de pago,
                  ver tu historial de facturación o cambiar tu plan.
                </p>
                <button
                  onClick={handleOpenPortal}
                  disabled={isLoadingPortal}
                  className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoadingPortal ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Abriendo portal...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Gestionar suscripción
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Cancel Subscription */}
            {subscriptionData.subscriptionStatus === "active" && (
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="font-semibold mb-2 text-amber-400">Cancelar Suscripción</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Tu suscripción premium seguirá activa hasta el final del período
                  de facturación actual. Después, perderás acceso a los
                  beneficios premium.
                </p>
                {!showCancelConfirm ? (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="px-4 py-2 rounded-lg border border-amber-500/30 text-amber-400 font-medium hover:bg-amber-500/10 transition-colors"
                  >
                    Cancelar suscripción
                  </button>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <p className="text-sm mb-4">
                      ¿Estás seguro de que quieres cancelar? Perderás acceso a:
                    </p>
                    <ul className="text-sm text-gray-400 mb-4 space-y-1">
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Mensajes ilimitados
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Personajes premium exclusivos
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Acceso anticipado a funciones
                      </li>
                    </ul>
                    <div className="flex gap-3">
                      <button
                        onClick={handleCancelSubscription}
                        disabled={isLoadingCancel}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {isLoadingCancel ? "Cancelando..." : "Sí, cancelar"}
                      </button>
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        className="px-4 py-2 rounded-lg border border-white/20 text-white font-medium hover:bg-white/10 transition-colors"
                      >
                        No, mantener suscripción
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="font-semibold mb-2">¿Necesitas ayuda?</h3>
          <p className="text-gray-400 text-sm mb-4">
            Si tienes alguna pregunta sobre tu suscripción o facturación,
            nuestro equipo de soporte está aquí para ayudarte.
          </p>
          <a
            href="mailto:soporte@talkielatam.com"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            soporte@talkielatam.com
          </a>
        </div>
      </div>
    </div>
  );
}
