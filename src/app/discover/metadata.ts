import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Descubrir Personajes",
  description:
    "Explora miles de personajes de IA creados por nuestra comunidad. Filtra por categoría: anime, videojuegos, ficción, películas y más.",
  keywords: [
    "descubrir personajes",
    "personajes AI",
    "buscar personajes",
    "anime",
    "videojuegos",
    "ficción",
    "chat AI",
    "explorar",
  ],
  openGraph: {
    title: "Descubrir Personajes | Talkie LATAM",
    description:
      "Explora miles de personajes de IA creados por nuestra comunidad. Filtra por categoría: anime, videojuegos, ficción y más.",
    images: [{ url: "/api/og?title=Descubrir%20Personajes", width: 1200, height: 630 }],
  },
};
