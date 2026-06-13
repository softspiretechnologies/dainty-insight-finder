import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

import { categoryImageFiles, productImageFiles } from "../src/data/upload-asset-map";

const ROOT = process.cwd();
const ASSETS_DIR = path.join(ROOT, "src/assets");
const UPLOADS_DIR = path.join(ROOT, "public/uploads");

async function copyAsset(assetFile: string, subdir: string, destName: string) {
  const src = path.join(ASSETS_DIR, assetFile);
  const destDir = path.join(UPLOADS_DIR, subdir);
  await mkdir(destDir, { recursive: true });
  await copyFile(src, path.join(destDir, destName));
}

async function main() {
  for (const [id, asset] of Object.entries(categoryImageFiles)) {
    await copyAsset(asset, "categories", `${id}.jpg`);
  }
  for (const [slug, asset] of Object.entries(productImageFiles)) {
    await copyAsset(asset, "products", `${slug}.jpg`);
  }
  console.log("Prepared public/uploads from src/assets");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
