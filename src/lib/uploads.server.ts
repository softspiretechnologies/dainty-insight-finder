import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

import { getServerConfig } from "@/lib/config.server";
import {
  assertValidImageUpload,
  EXT_BY_MIME,
  sanitizeUploadFilename,
} from "@/lib/upload-validation";
import {
  bundledUploadsReadRoots,
  isPathInsideRoot,
  isSafeRelativeUploadPath,
  resolveHostingerUploadsDir,
  resolvePersistentUploadsDir,
} from "@/lib/uploads-path";

function getAppRoot() {
  const cwd = process.cwd();
  if (existsSync(path.join(cwd, "dist", "public"))) return cwd;
  if (existsSync(path.join(cwd, "..", "public"))) return path.resolve(cwd, "..");
  if (existsSync(path.join(cwd, "..", "..", "dist", "public")))
    return path.resolve(cwd, "..", "..");
  return cwd;
}

function uploadsWriteRoot() {
  const { uploadsDir } = getServerConfig();
  return resolvePersistentUploadsDir(process.cwd(), uploadsDir);
}

function uploadsReadRoots() {
  const cwd = process.cwd();
  const roots = [
    uploadsWriteRoot(),
    resolveHostingerUploadsDir(cwd),
    ...bundledUploadsReadRoots(cwd),
  ].filter((dir): dir is string => Boolean(dir));

  const seen = new Set<string>();
  return roots.filter((dir) => {
    const resolved = path.resolve(dir);
    if (seen.has(resolved)) return false;
    seen.add(resolved);
    return true;
  });
}

export function resolveUploadFile(relativePath: string) {
  if (!isSafeRelativeUploadPath(relativePath)) return null;

  const relative = relativePath.replace(/^\/+/, "");
  for (const root of uploadsReadRoots()) {
    const filePath = path.join(root, relative);
    if (!isPathInsideRoot(filePath, root)) continue;
    if (existsSync(filePath)) return filePath;
  }
  return null;
}

async function mirrorUploadToPublicBundle(
  fullPath: string,
  subdir: "products" | "categories" | "services",
  filename: string,
) {
  const mirrorDir = path.join(getAppRoot(), "dist", "public", "uploads", subdir);
  if (!existsSync(path.dirname(mirrorDir))) return;

  await mkdir(mirrorDir, { recursive: true });
  const mirrorPath = path.join(mirrorDir, filename);
  const mirrorBuffer = await readFile(fullPath);
  await writeFile(mirrorPath, mirrorBuffer);
}

export async function saveUploadedImageFromPayload(
  payload: { name: string; type: string; data: string },
  subdir: "products" | "categories" | "services",
) {
  const buffer = assertValidImageUpload(payload);

  const ext = EXT_BY_MIME[payload.type] ?? ".jpg";
  const base =
    sanitizeUploadFilename(path.basename(payload.name, path.extname(payload.name))) || "image";
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
