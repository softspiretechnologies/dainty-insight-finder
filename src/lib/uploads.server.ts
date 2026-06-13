import { mkdir, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

import { getServerConfig } from "@/lib/config.server";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

function uploadsRoot() {
  const { uploadsDir } = getServerConfig();
  if (uploadsDir) return uploadsDir;

  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, "dist", "public", "uploads"),
    path.join(cwd, "public", "uploads"),
  ];
  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }
  return candidates[1];
}

function sanitizeFilename(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function extensionForMime(mime: string) {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  return "";
}

export async function saveUploadedImage(file: File, subdir: "products" | "categories") {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Only JPEG, PNG and WebP images are allowed");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 5 MB or smaller");
  }

  const ext = extensionForMime(file.type) || path.extname(file.name) || ".jpg";
  const base = sanitizeFilename(path.basename(file.name, path.extname(file.name))) || "image";
  const filename = `${base}-${Date.now()}${ext}`;
  const dir = path.join(uploadsRoot(), subdir);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const fullPath = path.join(dir, filename);
  await writeFile(fullPath, buffer);

  return `/uploads/${subdir}/${filename}`;
}

export async function deleteUploadedImage(imagePath: string | null | undefined) {
  if (!imagePath || !imagePath.startsWith("/uploads/")) return;

  const relative = imagePath.replace(/^\/uploads\//, "");
  const fullPath = path.join(uploadsRoot(), relative);

  try {
    await unlink(fullPath);
  } catch {
    // ignore missing files
  }
}

export function getUploadsRoot() {
  return uploadsRoot();
}
