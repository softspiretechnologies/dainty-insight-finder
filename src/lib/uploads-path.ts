import path from "node:path";

/**
 * Resolve the persistent Hostinger uploads directory from the process cwd.
 * Returns null when cwd is not a known Hostinger Node.js layout (local dev).
 */
export function resolveHostingerUploadsDir(cwd: string): string | null {
  const normalized = path.resolve(cwd);
  const marker = `${path.sep}hbuilds${path.sep}`;
  const idx = normalized.indexOf(marker);
  if (idx !== -1) {
    return path.join(normalized.slice(0, idx), "uploads");
  }

  if (path.basename(normalized) === "nodejs") {
    return path.join(normalized, "..", "uploads");
  }

  return null;
}

/**
 * Persistent runtime uploads directory. Env wins; otherwise Hostinger layout;
 * otherwise `../uploads` beside the current working directory.
 */
export function resolvePersistentUploadsDir(cwd: string, uploadsDirFromEnv?: string): string {
  const fromEnv = uploadsDirFromEnv?.trim();
  if (fromEnv) return fromEnv;
  return resolveHostingerUploadsDir(cwd) ?? path.join(cwd, "..", "uploads");
}

export function buildUploadsDir(cwd: string) {
  return path.join(cwd, "public", "uploads");
}

export function bundledUploadsReadRoots(cwd: string) {
  return [path.join(cwd, "dist", "public", "uploads"), path.join(cwd, "public", "uploads")];
}

export function isPathInsideRoot(filePath: string, root: string) {
  const resolvedRoot = path.resolve(root);
  const resolvedFile = path.resolve(filePath);
  return resolvedFile.startsWith(resolvedRoot + path.sep);
}

export function isSafeRelativeUploadPath(relativePath: string) {
  if (!relativePath || relativePath.includes("\0")) return false;
  const relative = relativePath.replace(/^[/\\]+/, "").replace(/\\/g, "/");
  if (!relative) return false;
  const normalized = path.posix.normalize(relative);
  return normalized !== ".." && !normalized.startsWith("../");
}
