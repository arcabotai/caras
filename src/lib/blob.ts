import { put } from "@vercel/blob";

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

/**
 * Upload an image buffer to Vercel Blob storage
 * @param buffer - Image data as Buffer
 * @param filename - Desired filename (will be prefixed with "avatars/")
 * @param contentType - MIME type (default: image/png)
 * @returns Public URL of uploaded image, or null if upload fails
 */
export async function uploadToBlob(
  buffer: Buffer,
  filename: string,
  contentType: string = "image/png"
): Promise<string | null> {
  if (!BLOB_TOKEN) {
    console.warn("[blob] BLOB_READ_WRITE_TOKEN not configured, cannot upload to Vercel Blob");
    return null;
  }

  try {
    const blob = await put(`avatars/${filename}`, buffer, {
      contentType,
      access: "public",
    });
    return blob.url;
  } catch (error) {
    console.error("[blob] Failed to upload to Vercel Blob:", error);
    return null;
  }
}

/**
 * Upload a base64-encoded image to Vercel Blob
 * @param base64Data - Base64 string (with or without data URI prefix)
 * @param filename - Desired filename
 * @returns Public URL of uploaded image, or null if upload fails
 */
export async function uploadBase64ToBlob(
  base64Data: string,
  filename: string
): Promise<string | null> {
  // Strip data URI prefix if present
  const base64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64, "base64");

  // Determine content type from data URI if present
  const mimeMatch = base64Data.match(/^data:(image\/\w+);base64,/);
  const contentType = mimeMatch ? mimeMatch[1] : "image/png";

  return uploadToBlob(buffer, filename, contentType);
}

/**
 * Generate a DiceBear fallback avatar URL
 * @param seed - Seed string (usually character name)
 * @param style - DiceBear style (default: avataaars)
 * @returns DiceBear avatar URL
 */
export function getDiceBearFallbackUrl(seed: string, style: string = "avataaars"): string {
  const encodedSeed = encodeURIComponent(seed);
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodedSeed}`;
}

/**
 * Upload image URL or return DiceBear fallback
 * If image is already a public URL, returns it directly
 * If image is base64 data, uploads to Vercel Blob
 * If no blob token, returns DiceBear fallback
 */
export async function processAvatarUrl(
  imageData: string,
  filename: string
): Promise<string> {
  // If it's already a public URL (not a data URI), return as-is
  if (imageData.startsWith("http://") || imageData.startsWith("https://")) {
    return imageData;
  }

  // If it's base64, try to upload to blob
  if (imageData.startsWith("data:")) {
    const blobUrl = await uploadBase64ToBlob(imageData, filename);
    if (blobUrl) {
      return blobUrl;
    }
  }

  // Fallback to DiceBear
  return getDiceBearFallbackUrl(filename.replace(/\.[^.]+$/, ""));
}

/**
 * Check if Vercel Blob is configured
 */
export function isBlobConfigured(): boolean {
  return Boolean(BLOB_TOKEN);
}
