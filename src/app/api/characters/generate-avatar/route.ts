import { auth } from "@/lib/auth";
import { uploadToBlob, getDiceBearFallbackUrl, isBlobConfigured } from "@/lib/blob";
import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

// Replicate API configuration
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_API_URL = "https://api.replicate.com/v1";

// Generation timeout in milliseconds (90 seconds)
const GENERATION_TIMEOUT = 90_000;

/**
 * Sanitize prompt to prevent injection
 */
function sanitizePrompt(text: string): string {
  // Remove any control characters and limit length
  return text
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/\\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

/**
 * Build the FLUX prompt for avatar generation
 */
function buildFluxPrompt(name: string, shortDesc: string): string {
  const sanitizedName = sanitizePrompt(name);
  const sanitizedDesc = sanitizePrompt(shortDesc);

  return `${sanitizedName}, ${sanitizedDesc}. Portrait, anime style character illustration, vibrant colors, high quality, detailed face, clean background, colorful`;
}

/**
 * Poll Replicate prediction until completion
 */
async function pollPrediction(
  predictionUrl: string,
  token: string,
  timeout: number
): Promise<{ status: string; output?: string; error?: string }> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const response = await fetch(predictionUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { status: "failed", error: `Replicate API error: ${response.status} - ${errorText}` };
    }

    const data = await response.json();

    if (data.status === "succeeded") {
      // FLUX returns an array of output URLs
      const outputUrl = Array.isArray(data.output) ? data.output[0] : data.output;
      return { status: "succeeded", output: outputUrl };
    }

    if (data.status === "failed") {
      return { status: "failed", error: data.error || "Prediction failed" };
    }

    // Wait 2 seconds before next poll
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return { status: "failed", error: "Generation timeout exceeded (90s)" };
}

/**
 * Download image from URL and return as Buffer
 */
async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * POST /api/characters/generate-avatar
 * Generate an AI avatar using FLUX and upload to Vercel Blob
 */
export async function POST(req: NextRequest) {
  // Require authentication
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { name: string; shortDesc: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido en el cuerpo de la solicitud" }, { status: 400 });
  }

  const { name, shortDesc } = body;

  // Validate inputs
  if (!name || typeof name !== "string" || name.trim().length < 1) {
    return Response.json({ error: "El nombre es requerido" }, { status: 400 });
  }

  if (!shortDesc || typeof shortDesc !== "string" || shortDesc.trim().length < 10) {
    return Response.json(
      { error: "La descripción debe tener al menos 10 caracteres" },
      { status: 400 }
    );
  }

  // Check if Replicate token is configured
  if (!REPLICATE_API_TOKEN) {
    console.warn("[generate-avatar] REPLICATE_API_TOKEN not configured, using fallback");
    const fallbackUrl = getDiceBearFallbackUrl(name.trim());
    return Response.json({
      avatarUrl: fallbackUrl,
      source: "dicebear",
      message: "Modo de demostración: usando avatar generativo (configura REPLICATE_API_TOKEN para avatares IA)",
    });
  }

  try {
    // Build the prompt
    const prompt = buildFluxPrompt(name, shortDesc);

    // Start FLUX prediction
    // Using flux-schnell for faster generation (typically 1-2 min vs 5-10 min for flux-dev)
    const createResponse = await fetch(`${REPLICATE_API_URL}/predictions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "sdxs-ai/flux-schnell",
        input: {
          prompt,
          num_inference_steps: 4, // Fast generation
          guidance_scale: 0,
          prompt_strength: 0.8,
        },
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error("[generate-avatar] Failed to create prediction:", errorText);
      throw new Error(`Failed to create prediction: ${createResponse.status}`);
    }

    const prediction = await createResponse.json();
    const predictionUrl = prediction.urls?.cancel || prediction.urls?.get;

    if (!predictionUrl) {
      throw new Error("No prediction URL returned");
    }

    // Poll for completion
    console.log(`[generate-avatar] Waiting for prediction: ${prediction.id}`);
    const result = await pollPrediction(predictionUrl, REPLICATE_API_TOKEN, GENERATION_TIMEOUT);

    if (result.status !== "succeeded" || !result.output) {
      console.error("[generate-avatar] Prediction failed:", result.error);
      throw new Error(result.error || "Generation failed");
    }

    // Download the generated image
    const imageBuffer = await downloadImage(result.output);

    // Upload to Vercel Blob
    const filename = `${name.trim().replace(/[^a-zA-Z0-9]/g, "_")}_${uuidv4().slice(0, 8)}.png`;

    if (isBlobConfigured()) {
      const blobUrl = await uploadToBlob(imageBuffer, filename, "image/png");
      if (blobUrl) {
        return Response.json({
          avatarUrl: blobUrl,
          source: "flux",
          prompt,
          message: "Avatar generado con éxito usando FLUX AI",
        });
      }
      // Fall through to return original URL if blob upload fails
      console.warn("[generate-avatar] Blob upload failed, returning original URL");
    }

    // Return original URL if blob not configured or upload failed
    return Response.json({
      avatarUrl: result.output,
      source: "flux",
      prompt,
      message: "Avatar generado (configura BLOB_READ_WRITE_TOKEN para almacenar imágenes)",
    });
  } catch (error) {
    console.error("[generate-avatar] Error:", error);

    // Return DiceBear fallback on any error
    const fallbackUrl = getDiceBearFallbackUrl(name.trim());
    return Response.json({
      avatarUrl: fallbackUrl,
      source: "dicebear",
      error: "No se pudo generar el avatar. Se usó un avatar alternativo.",
      message: "Generación de avatar fallida, usando avatar generativo como alternativa",
    });
  }
}

/**
 * GET /api/characters/generate-avatar
 * Health check / info endpoint
 */
export async function GET() {
  return Response.json({
    status: "ok",
    provider: "flux-schnell",
    estimatedCost: "$0.01-0.05 USD por generación",
    timeout: "90 segundos",
    features: [
      "Generación de avatares estilo anime",
      "Subida automática a Vercel Blob",
      "Fallback a DiceBear si FLUX falla",
    ],
    configured: {
      replicate: Boolean(REPLICATE_API_TOKEN),
      blob: isBlobConfigured(),
    },
  });
}
