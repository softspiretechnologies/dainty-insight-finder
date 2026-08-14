import { describe, expect, it } from "vitest";

import { imageSrcSet, imageVariantPath, imageVariantWidths } from "./image-variants";

describe("image variant helpers", () => {
  it("preserves legacy image paths", () => {
    expect(imageVariantWidths("/uploads/products/legacy.jpg")).toEqual([]);
    expect(imageSrcSet("/uploads/products/legacy.jpg")).toBeUndefined();
  });

  it("builds responsive paths for optimized uploads", () => {
    const image = "/uploads/products/gift-123-1440.webp";
    expect(imageVariantWidths(image)).toEqual([640, 960, 1440]);
    expect(imageVariantPath(image, 640)).toBe("/uploads/products/gift-123-640.webp");
    expect(imageSrcSet(image)).toContain("gift-123-960.webp 960w");
  });
});
