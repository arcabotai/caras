export const categories = [
  { id: "anime", label: "Anime", emoji: "🎌" },
  { id: "game", label: "Videojuegos", emoji: "🎮" },
  { id: "fiction", label: "Ficción", emoji: "📚" },
  { id: "media", label: "Películas y TV", emoji: "🎬" },
  { id: "custom", label: "Originales", emoji: "✨" },
  { id: "featured", label: "Destacados", emoji: "⭐" },
];

export const featuredCharacters = [
  {
    id: "demo-1",
    name: "Kai Nakamura",
    shortDesc: "El chico perfecto de tu academia. Frío por fuera, pero esconde un pasado oscuro que nadie conoce.",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
    replyCount: 12450,
    category: "anime",
    isPremium: false,
  },
  {
    id: "demo-2",
    name: "El Detective Moreno",
    shortDesc: "Ex刑警 reconvertido en detective privado. Siempre tiene un caso sin resolver y un café frío en la mesa.",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    replyCount: 8932,
    category: "fiction",
    isPremium: false,
  },
  {
    id: "demo-3",
    name: "Valentina Cruz",
    shortDesc: "Tu nuova compagna di stanza. Sembra odiarvi, ma in realtà ha una cotta per te!",
    avatarUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop",
    replyCount: 22100,
    category: "custom",
    isPremium: true,
  },
  {
    id: "demo-4",
    name: "Marcus Elric",
    shortDesc: "Un vampiro que lleva 500 años buscando a su alma gemela. Ahora te ha encontrado a ti.",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
    replyCount: 18700,
    category: "fiction",
    isPremium: true,
  },
  {
    id: "demo-5",
    name: "Luna Tsukino",
    shortDesc: "Una maga aprendiz de 17 años en una academia de hechizos. ¿Su debilidad? Las arañas.",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
    replyCount: 15400,
    category: "anime",
    isPremium: false,
  },
  {
    id: "demo-6",
    name: "Diego \"El Zorro\"",
    shortDesc: "Un hacker de 22 años que vive en el submundo digital. Conoce todos tus secretos... o casi.",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    replyCount: 11800,
    category: "custom",
    isPremium: false,
  },
];

export const sortOptions = [
  { id: "popular", label: "Más populares" },
  { id: "new", label: "Nuevos" },
  { id: "trending", label: "Trending" },
];