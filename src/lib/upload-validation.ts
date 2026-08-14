export const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export function isAllowedImageMime(type: string) {
  return ALLOWED_IMAGE_TYPES.has(type);
}

export function sanitizeUploadFilename(name: string) {
  return name
    .toLowerCase()
    .replace(/\.\./g, "")
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/^\.+/, "")
    .slice(0, 80);
}

export function validateImageBuffer(buffer: Buffer, mime: string) {
  if (mime === "image/jpeg" && buffer[0] === 0xff && buffer[1] === 0xd8) return;
  if (
    mime === "image/png" &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return;
  }
  if (
    mime === "image/webp" &&
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return;
  }
  throw new Error("File content does not match the declared image type");
}

export function assertValidImageUpload(payload: { type: string; data: string }) {
  if (!isAllowedImageMime(payload.type)) {
    throw new Error("Only JPEG, PNG and WebP images are allowed");
  }

  const buffer = Buffer.from(payload.data, "base64");
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error("Image must be 5 MB or smaller");
  }
  validateImageBuffer(buffer, payload.type);
  return buffer;
}
