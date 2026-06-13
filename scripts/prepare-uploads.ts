import { mkdir } from "node:fs/promises";
import path from "node:path";

import { categoryImageFiles, productImageFiles } from "../src/data/upload-asset-map";
import { serviceImageFiles } from "../src/data/service-asset-map";
import { optimizeSeedImage } from "../src/lib/image-optimize.server";
import { allUploadTargets } from "./lib/uploads-path";

const ASSETS_DIR = path.join(process.cwd(), "src/assets");

async function copyAsset(targetRoot: string, assetFile: string, subdir: string, destName: string) {
  const src = path.join(ASSETS_DIR, assetFile);
  const destDir = path.join(targetRoot, subdir);
  await mkdir(destDir, { recursive: true });
  await optimizeSeedImage(src, path.join(destDir, destName));
}

async function main() {
  const targets = allUploadTargets();

  for (const targetRoot of targets) {
    for (const [id, asset] of Object.entries(categoryImageFiles)) {
      await copyAsset(targetRoot, asset, "categories", `${id}.jpg`);
    }
    for (const [slug, asset] of Object.entries(productImageFiles)) {
      await copyAsset(targetRoot, asset, "products", `${slug}.jpg`);
    }
    for (const [id, asset] of Object.entries(serviceImageFiles)) {
      await copyAsset(targetRoot, asset, "services", `${id}.jpg`);
    }
    console.log(`Prepared uploads at ${targetRoot}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
