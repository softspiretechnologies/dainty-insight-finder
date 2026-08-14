const OPTIMIZED_IMAGE_PATTERN = /^(.*)-(\d+)\.webp$/i;
const STANDARD_WIDTHS = [640, 960, 1440] as const;

export function imageVariantPath(imagePath: string, width: number) {
  const match = imagePath.match(OPTIMIZED_IMAGE_PATTERN);
  return match ? `${match[1]}-${width}.webp` : imagePath;
}

export function imageVariantWidths(imagePath: string) {
  const match = imagePath.match(OPTIMIZED_IMAGE_PATTERN);
  if (!match) return [];
  const maxWidth = Number(match[2]);
  return [...STANDARD_WIDTHS.filter((width) => width <= maxWidth), maxWidth]
    .filter((width, index, widths) => widths.indexOf(width) === index)
    .sort((a, b) => a - b);
}

export function imageSrcSet(imagePath: string) {
  const widths = imageVariantWidths(imagePath);
  if (widths.length < 2) return undefined;
  return widths.map((width) => `${imageVariantPath(imagePath, width)} ${width}w`).join(", ");
}
