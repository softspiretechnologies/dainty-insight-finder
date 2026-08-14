import path from "node:path";

/** Build-time / seed target (bundled into dist/public/uploads). */
export function buildUploadsDir() {
  return path.join(process.cwd(), "public", "uploads");
}

function hostingerDomainUploadsDir(cwd = process.cwd()) {
  const marker = `${path.sep}hbuilds${path.sep}`;
  const idx = cwd.indexOf(marker);
  if (idx !== -1) return path.join(cwd.slice(0, idx), "uploads");
  if (path.basename(cwd) === "nodejs") return path.join(cwd, "..", "uploads");
  return null;
}

/** Persistent disk path for runtime admin uploads (survives redeploy). */
export function persistentUploadsDir() {
  const fromEnv = process.env.UPLOADS_DIR?.trim();
  if (fromEnv) return fromEnv;

  // Hostinger runs from …/hbuilds/current/nodejs — uploads live at the domain root.
  return hostingerDomainUploadsDir() ?? path.join(process.cwd(), "..", "uploads");
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
