import path from "node:path";

import {
  buildUploadsDir as resolveBuildUploadsDir,
  resolvePersistentUploadsDir,
} from "../../src/lib/uploads-path";

/** Build-time / seed target (bundled into dist/public/uploads). */
export function buildUploadsDir() {
  return resolveBuildUploadsDir(process.cwd());
}

/** Persistent disk path for runtime admin uploads (survives redeploy). */
export function persistentUploadsDir() {
  return resolvePersistentUploadsDir(process.cwd(), process.env.UPLOADS_DIR);
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
