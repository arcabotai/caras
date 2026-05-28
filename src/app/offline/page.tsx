"use client";

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#0f0f1a]">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.25) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />

      <div className="relative flex flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-xl shadow-purple-900/30">
            <span className="text-3xl font-bold text-white">T</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Talkie LATAM
          </h1>
        </div>

        <div className="flex flex-col items-center gap-4 max-w-xs">
          <svg
            className="w-12 h-12 text-violet-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
          <p className="text-violet-200 text-base leading-relaxed">
            No tienes conexión a internet en este momento.
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold shadow-lg shadow-purple-900/40 hover:from-violet-500 hover:to-purple-500 active:scale-95 transition-all duration-150 cursor-pointer"
        >
          Reintentar
        </button>
      </div>
    </main>
  );
}
