import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

import { getServerConfig } from "@/lib/config.server";

function getAppRoot() {
  const cwd = process.cwd();
  if (existsSync(path.join(cwd, "dist", "public"))) return cwd;
  if (existsSync(path.join(cwd, "..", "public"))) return path.resolve(cwd, "..");
  if (existsSync(path.join(cwd, "..", "..", "dist", "public"))) return path.resolve(cwd, "..", "..");
  return cwd;
}

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

function validateImageBuffer(buffer: Buffer, mime: string) {
  if (mime === "image/jpeg" && buffer[0] === 0xff && buffer[1] === 0xd8) return;
  if (mime === "image/png" && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return;
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

async function mirrorUploadToPublicBundle(fullPath: string, subdir: "products" | "categories", filename: string) {
  const mirrorDir = path.join(getAppRoot(), "dist", "public", "uploads", subdir);
  if (!existsSync(path.dirname(mirrorDir))) return;

  await mkdir(mirrorDir, { recursive: true });
  const mirrorPath = path.join(mirrorDir, filename);
  const mirrorBuffer = await readFile(fullPath);
  await writeFile(mirrorPath, mirrorBuffer);
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
  validateImageBuffer(buffer, payload.type);

  const ext = extensionForMime(payload.type) || path.extname(payload.name) || ".jpg";
  const base = sanitizeFilename(path.basename(payload.name, path.extname(payload.name))) || "image";
  const filename = `${base}-${Date.now()}${ext}`;
  const dir = path.join(uploadsWriteRoot(), subdir);
  await mkdir(dir, { recursive: true });

  const fullPath = path.join(dir, filename);
  await writeFile(fullPath, buffer);

  try {
    await mirrorUploadToPublicBundle(fullPath, subdir, filename);
  } catch {
    // Non-fatal: persistent copy is the source of truth.
  }

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
