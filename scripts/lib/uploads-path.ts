import path from "node:path";

/** Build-time / seed target (bundled into dist/public/uploads). */
export function buildUploadsDir() {
  return path.join(process.cwd(), "public", "uploads");
}

/** Persistent disk path for runtime admin uploads (survives redeploy). */
export function persistentUploadsDir() {
  const fromEnv = process.env.UPLOADS_DIR?.trim();
  if (fromEnv) return fromEnv;

  // Hostinger Node.js apps run from …/domains/<site>/nodejs — store uploads one level up.
  return path.join(process.cwd(), "..", "uploads");
}

export function allUploadTargets() {
  const seen = new Set<string>();
  const targets: string[] = [];

  for (const dir of [buildUploadsDir(), persistentUploadsDir()]) {
    const resolved = path.resolve(dir);
    if (!seen.has(resolved)) {
      seen.add(resolved);
      targets.push(resolved);
    }
  }

  return targets;
}
