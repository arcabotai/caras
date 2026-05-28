import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import { InstallPrompt } from "@/components/InstallPrompt";

const inter = Inter({ subsets: ["latin"] });

// Base URL for absolute URLs in metadata
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://talkielatam.com";

// JSON-LD Structured Data for Organization and WebSite
const jsonLdData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://talkielatam.com/#organization",
      name: "Talkie LATAM",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/icons/icon-192.png`,
      },
      sameAs: [
        "https://twitter.com/talkielatam",
        "https://instagram.com/talkielatam",
        "https://tiktok.com/@talkielatam",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        email: "contact@talkielatam.com",
        contactType: "customer service",
        availableLanguage: ["Spanish", "es"],
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://talkielatam.com/#website",
      url: BASE_URL,
      name: "Talkie LATAM",
      publisher: { "@id": "https://talkielatam.com/#organization" },
      description:
        "Plataforma de chat con personajes de IA para Latinoamérica. Anime, videojuegos, ficción y más.",
      inLanguage: "es-419",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${BASE_URL}/discover?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

// Base metadata with OpenGraph and Twitter Cards
const baseMetadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Talkie LATAM - Chat con Personajes de IA",
    template: "%s | Talkie LATAM",
  },
  description:
    "Chatea con tus personajes de IA favoritos. Anime, videojuegos, ficción y más. Crea tus propios personajes y sumérgete en conversaciones únicas.",
  keywords: [
    "chat AI",
    "personajes AI",
    "anime chat",
    "chatbot personajes",
    "IA conversación",
    "chat interactivo",
    "videojuegos chat",
    "ficción interactiva",
    "latinoamérica",
    "character AI",
    "AI companion",
    "conversational AI",
    "virtual characters",
    "AI chat app",
  ],
  authors: [{ name: "Talkie LATAM", url: BASE_URL }],
  creator: {
    name: "Talkie LATAM",
    url: BASE_URL,
  },
  publisher: {
    name: "Talkie LATAM",
    url: BASE_URL,
  },
  openGraph: {
    type: "website",
    locale: "es_LA",
    url: BASE_URL,
    siteName: "Talkie LATAM",
    title: "Talkie LATAM - Chat con Personajes de IA",
    description:
      "Chatea con tus personajes de IA favoritos. Anime, videojuegos, ficción y más. Crea tus propios personajes y sumérgete en conversaciones únicas.",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Talkie LATAM - Chat con Personajes de IA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Talkie LATAM - Chat con Personajes de IA",
    description:
      "Chatea con tus personajes de IA favoritos. Anime, videojuegos, ficción y más.",
    images: ["/api/og"],
    site: "@talkielatam",
    creator: "@talkielatam",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  themeColor: "#7c3aed",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Talkie LATAM",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

// Add noindex in non-production environments
if (process.env.NODE_ENV !== "production") {
  baseMetadata.robots = {
    index: false,
    follow: false,
  };
}

export const metadata: Metadata = baseMetadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-419" className="dark">
      <head>
        {/* JSON-LD Structured Data */}
        <Script
          id="jsonld-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <InstallPrompt />
        <Script src="/pwa.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}