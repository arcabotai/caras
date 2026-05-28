import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Optional title override for character pages
    const title = searchParams.get("title") || "Chat con Personajes de IA";
    const description =
      searchParams.get("description") ||
      "Chatea con personajes de IA creados por la comunidad. Anime, videojuegos, ficción y más.";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0f0f1a",
            backgroundImage: "linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 50%, #0f0f1a 100%)",
          }}
        >
          {/* Decorative gradient circles */}
          <div
            style={{
              position: "absolute",
              top: -100,
              right: -100,
              width: 400,
              height: 400,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -150,
              left: -100,
              width: 500,
              height: 500,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(236, 72, 153, 0.25) 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
          />

          {/* Logo / Brand mark */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 40,
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
                color: "white",
                fontWeight: "bold",
                boxShadow: "0 0 60px rgba(139, 92, 246, 0.5)",
              }}
            >
              T
            </div>
          </div>

          {/* Brand name */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <span
              style={{
                fontSize: 56,
                fontWeight: 800,
                color: "white",
                letterSpacing: "-0.02em",
              }}
            >
              TALKIE
            </span>
            <span
              style={{
                fontSize: 56,
                fontWeight: 800,
                color: "#a855f7",
                marginLeft: 12,
              }}
            >
              LATAM
            </span>
          </div>

          {/* Page title */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              maxWidth: 900,
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontSize: 32,
                color: "#d4d4d8",
                fontWeight: 500,
              }}
            >
              {title}
            </span>
          </div>

          {/* Tagline / description */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 20,
              maxWidth: 800,
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontSize: 20,
                color: "#71717a",
              }}
            >
              {description}
            </span>
          </div>

          {/* Bottom accent bar */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 6,
              background: "linear-gradient(90deg, #8b5cf6 0%, #ec4899 50%, #8b5cf6 100%)",
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("OG Image generation error:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}