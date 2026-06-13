import sharp from "sharp";

export const UPLOAD_MAX_WIDTH = 1200;
export const UPLOAD_JPEG_QUALITY = 82;
export const UPLOAD_WEBP_QUALITY = 82;

/** Resize and compress catalog uploads — output WebP for best size/quality. */
export async function optimizeUploadBuffer(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize(UPLOAD_MAX_WIDTH, UPLOAD_MAX_WIDTH, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: UPLOAD_WEBP_QUALITY, effort: 4 })
    .toBuffer();
}

/** Resize and compress seed/build assets — keep JPEG paths for existing DB slugs. */
export async function optimizeSeedImage(srcPath: string, destPath: string) {
  await sharp(srcPath)
    .rotate()
    .resize(UPLOAD_MAX_WIDTH, UPLOAD_MAX_WIDTH, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: UPLOAD_JPEG_QUALITY, mozjpeg: true })
    .toFile(destPath);
}
