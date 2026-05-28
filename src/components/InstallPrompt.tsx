"use client";

import { useEffect, useState } from "react";

const DISMISSAL_KEY = "talkie_install_dismissed";
const DISMISSAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);

  useEffect(() => {
    // Check if dismissed recently
    const dismissedAt = localStorage.getItem(DISMISSAL_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < DISMISSAL_DURATION_MS) return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await (deferredPrompt as any).prompt();
    const result = await (deferredPrompt as any).userChoice;
    if (result.outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSAL_KEY, String(Date.now()));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div
        className="pointer-events-auto flex items-center gap-4 px-5 py-4 rounded-2xl shadow-2xl border border-purple-500/30"
        style={{
          background: "linear-gradient(135deg, #1e1030 0%, #2d1b5e 100%)",
          backdropFilter: "blur(12px)",
          maxWidth: "480px",
          width: "100%",
        }}
      >
        {/* Icon */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
        >
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5 5 5M12 5v9"
            />
          </svg>
        </div>

        {/* Text */}
        <p className="text-sm font-medium text-purple-100 flex-1 leading-snug">
          Instala Talkie para mejores experiencias
        </p>

        {/* Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleInstall}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-150 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              boxShadow: "0 4px 12px rgba(124,58,237,0.4)",
            }}
          >
            Instalar
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 rounded-xl text-purple-300 hover:text-purple-100 hover:bg-purple-800/30 transition-colors duration-150"
            aria-label="Cerrar"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}