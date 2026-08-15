import { describe, expect, it } from "vitest";

import { shouldOptimizeImageForUpload } from "@/lib/admin-upload-payload";

describe("client image upload optimization gate", () => {
  it("skips small images", () => {
    expect(shouldOptimizeImageForUpload({ size: 400_000, type: "image/jpeg" })).toBe(false);
  });

  it("flags large jpeg/png/webp", () => {
    expect(shouldOptimizeImageForUpload({ size: 2_000_000, type: "image/jpeg" })).toBe(true);
    expect(shouldOptimizeImageForUpload({ size: 2_000_000, type: "image/png" })).toBe(true);
    expect(shouldOptimizeImageForUpload({ size: 2_000_000, type: "image/webp" })).toBe(true);
  });

  it("ignores unsupported types", () => {
    expect(shouldOptimizeImageForUpload({ size: 3_000_000, type: "image/gif" })).toBe(false);
  });
});
