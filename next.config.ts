import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ─── Producción standalone para deployments Docker-friendly ────
  output: "standalone",

  // ─── Dominios de imagen permitidos ────
  images: {
    remotePatterns: [
      // Avatares de DiceBear (generación procedimental)
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
      // Avatares de Google (fotos de perfil OAuth)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      // Imágenes de avatares en R2/Blob (archivos subidos)
      {
        protocol: "https",
        hostname: "*.public.r2.dev",
        pathname: "/**",
      },
      // Vercel Blob (dominio por defecto)
      {
        protocol: "https",
        hostname: "*.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },

  // ─── Headers de seguridad y PWA ────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Seguridad
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // PWA — cache y service worker
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Service Worker
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Type",
            value: "application/javascript, charset=utf-8",
          },
        ],
      },
      // Manifest
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
        ],
      },
      // API routes — sin cache por defecto
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
