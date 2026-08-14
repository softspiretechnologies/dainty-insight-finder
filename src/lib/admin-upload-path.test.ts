import { describe, expect, it } from "vitest";

import { isValidUploadPath } from "@/lib/admin-upload-path";

describe("isValidUploadPath", () => {
  it("accepts a matching subdirectory path", () => {
    expect(isValidUploadPath("/uploads/products/hamper-1.jpg", "products")).toBe(true);
    expect(isValidUploadPath("/uploads/categories/hampers.png", "categories")).toBe(true);
    expect(isValidUploadPath("/uploads/services/reels.webp", "services")).toBe(true);
  });

  it("rejects traversal, other directories, and mismatched subdirs", () => {
    expect(isValidUploadPath("/uploads/products/../services/x.jpg", "products")).toBe(false);
    expect(isValidUploadPath("/uploads/products/hamper.jpg", "categories")).toBe(false);
    expect(isValidUploadPath("/etc/passwd", "products")).toBe(false);
    expect(isValidUploadPath("uploads/products/hamper.jpg", "products")).toBe(false);
  });
});
