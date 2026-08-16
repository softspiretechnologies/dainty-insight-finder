import { describe, expect, it } from "vitest";

import {
  allocateUniqueProductSlugs,
  duplicateProductDisplayName,
  slugifyProductName,
} from "@/lib/product-slug";

describe("slugifyProductName", () => {
  it("slugifies names", () => {
    expect(slugifyProductName("Ribbon Wrap Hamper")).toBe("ribbon-wrap-hamper");
    expect(slugifyProductName("  !!!  ")).toBe("product");
  });
});

describe("allocateUniqueProductSlugs", () => {
  it("generates unique slugs for similar names", () => {
    const slugs = allocateUniqueProductSlugs(
      ["Satin Bow", "Satin Bow", "Satin Bow Box"],
      ["satin-bow"],
    );
    expect(slugs).toEqual(["satin-bow-2", "satin-bow-3", "satin-bow-box"]);
  });

  it("does not mutate the existing slug list", () => {
    const existing = ["gift-box"];
    allocateUniqueProductSlugs(["Gift Box"], existing);
    expect(existing).toEqual(["gift-box"]);
  });
});

describe("duplicateProductDisplayName", () => {
  it("appends Copy and respects max length", () => {
    expect(duplicateProductDisplayName("Ribbon Wrap")).toBe("Ribbon Wrap Copy");
    expect(duplicateProductDisplayName("x".repeat(300)).length).toBe(256);
  });
});
