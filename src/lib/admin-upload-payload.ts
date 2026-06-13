import type { ImageUploadPayload } from "@/lib/admin-schemas";

export type { ImageUploadPayload } from "@/lib/admin-schemas";
export { imageUploadPayloadSchema } from "@/lib/admin-schemas";

export async function fileToUploadPayload(file: File): Promise<ImageUploadPayload> {
  const type = file.type;
  if (type !== "image/jpeg" && type !== "image/png" && type !== "image/webp") {
    throw new Error("Only JPEG, PNG and WebP images are allowed");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image must be 5 MB or smaller");
  }

  const data = await readFileAsBase64(file);
  return { name: file.name, type, data };
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
