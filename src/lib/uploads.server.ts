import { mkdir, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

import { getServerConfig } from "@/lib/config.server";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

function uploadsWriteRoot() {
  const { uploadsDir } = getServerConfig();
  if (uploadsDir) return uploadsDir;
  return path.join(process.cwd(), "..", "uploads");
}

function uploadsReadRoots() {
  const cwd = process.cwd();
  const roots = [
    uploadsWriteRoot(),
    path.join(cwd, "dist", "public", "uploads"),
    path.join(cwd, "public", "uploads"),
  ];

  const seen = new Set<string>();
  return roots.filter((dir) => {
    const resolved = path.resolve(dir);
    if (seen.has(resolved)) return false;
    seen.add(resolved);
    return true;
  });
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

export function resolveUploadFile(relativePath: string) {
  const relative = relativePath.replace(/^\/+/, "");
  for (const root of uploadsReadRoots()) {
    const filePath = path.join(root, relative);
    const resolvedRoot = path.resolve(root);
    if (!path.resolve(filePath).startsWith(resolvedRoot + path.sep)) continue;
    if (existsSync(filePath)) return filePath;
  }
  return null;
}

export async function saveUploadedImageFromPayload(
  payload: { name: string; type: string; data: string },
  subdir: "products" | "categories",
) {
  if (!ALLOWED_TYPES.has(payload.type)) {
    throw new Error("Only JPEG, PNG and WebP images are allowed");
  }

  const buffer = Buffer.from(payload.data, "base64");
  if (buffer.length > MAX_BYTES) {
    throw new Error("Image must be 5 MB or smaller");
  }

  const ext = extensionForMime(payload.type) || path.extname(payload.name) || ".jpg";
  const base = sanitizeFilename(path.basename(payload.name, path.extname(payload.name))) || "image";
  const filename = `${base}-${Date.now()}${ext}`;
  const dir = path.join(uploadsWriteRoot(), subdir);
  await mkdir(dir, { recursive: true });

  const fullPath = path.join(dir, filename);
  await writeFile(fullPath, buffer);

  return `/uploads/${subdir}/${filename}`;
}

export async function deleteUploadedImage(imagePath: string | null | undefined) {
  if (!imagePath || !imagePath.startsWith("/uploads/")) return;

  const relative = imagePath.replace(/^\/uploads\//, "");
  const filePath = resolveUploadFile(relative);
  if (!filePath) return;

  try {
    await unlink(filePath);
  } catch {
    // ignore missing files
  }
}

export function getUploadsRoot() {
  return uploadsWriteRoot();
}
