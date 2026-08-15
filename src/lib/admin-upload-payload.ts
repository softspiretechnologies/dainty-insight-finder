import { MAX_UPLOAD_BYTES } from "@/lib/upload-validation";
import type { ImageUploadPayload } from "@/lib/admin-schemas";

export type { ImageUploadPayload } from "@/lib/admin-schemas";
export { imageUploadPayloadSchema } from "@/lib/admin-schemas";

const OPTIMIZE_IF_LARGER_THAN = 900_000;
const MAX_LONG_EDGE = 1920;
const OUTPUT_QUALITY = 0.82;

/** Whether a file is a candidate for client-side resize before upload. */
export function shouldOptimizeImageForUpload(file: Pick<File, "size" | "type">): boolean {
  if (file.type !== "image/jpeg" && file.type !== "image/png" && file.type !== "image/webp") {
    return false;
  }
  return file.size > OPTIMIZE_IF_LARGER_THAN;
}

/**
 * Best-effort browser resize/encode. Returns null to keep the original file.
 * Server Sharp processing remains the source of truth.
 */
export async function maybeOptimizeImageForUpload(file: File): Promise<File | null> {
  if (!shouldOptimizeImageForUpload(file)) return null;
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") return null;

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
    const longEdge = Math.max(bitmap.width, bitmap.height);
    if (longEdge <= MAX_LONG_EDGE && file.size <= 1_200_000) {
      return null;
    }

    const scale = longEdge > MAX_LONG_EDGE ? MAX_LONG_EDGE / longEdge : 1;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob =
      (await canvasToBlob(canvas, "image/webp", OUTPUT_QUALITY)) ??
      (await canvasToBlob(canvas, "image/jpeg", OUTPUT_QUALITY));
    if (!blob || blob.size <= 0 || blob.size >= file.size) return null;

    const extension = blob.type === "image/webp" ? "webp" : "jpg";
    const baseName = file.name.replace(/\.[^.]+$/, "") || "upload";
    return new File([blob], `${baseName}.${extension}`, { type: blob.type });
  } catch {
    return null;
  } finally {
    bitmap?.close();
  }
}

export async function fileToUploadPayload(file: File): Promise<ImageUploadPayload> {
  const type = file.type;
  if (type !== "image/jpeg" && type !== "image/png" && type !== "image/webp") {
    throw new Error("Only JPEG, PNG and WebP images are allowed");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Image must be 5 MB or smaller");
  }

  let working = file;
  try {
    const optimized = await maybeOptimizeImageForUpload(file);
    if (optimized && optimized.size <= MAX_UPLOAD_BYTES) {
      working = optimized;
    }
  } catch {
    working = file;
  }

  if (working.size > MAX_UPLOAD_BYTES) {
    throw new Error("Image must be 5 MB or smaller");
  }

  const data = await readFileAsBase64(working);
  return { name: working.name, type: working.type as ImageUploadPayload["type"], data };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to read image file"));
        return;
      }
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}
