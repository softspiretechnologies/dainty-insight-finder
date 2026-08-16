import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { buildBulkQuickProductInsertRows } from "@/lib/admin-product-bulk";
import {
  MAX_BULK_QUICK_PRODUCTS,
  bulkProductQuickCreateSchema,
  duplicateProductInputSchema,
  imageUploadPayloadSchema,
  productInputSchema,
} from "@/lib/admin-schemas";
import { allocateUniqueProductSlugs, duplicateProductDisplayName } from "@/lib/product-slug";

const tinyJpegBase64 =
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGcP//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//Z";

function validBulkImage(overrides: Partial<{ name: string; type: string; data: string }> = {}) {
  return {
    name: "photo.jpg",
    type: "image/jpeg" as const,
    data: tinyJpegBase64,
    ...overrides,
  };
}

function validBulkItem(
  overrides: Partial<{
    name: string;
    categoryId: string;
    priceFrom?: string;
    image: ReturnType<typeof validBulkImage>;
  }> = {},
) {
  return {
    name: "Satin Bow Hamper",
    categoryId: "hampers",
    image: validBulkImage(),
    ...overrides,
  };
}

describe("bulkProductQuickCreateSchema", () => {
  it(`rejects more than ${MAX_BULK_QUICK_PRODUCTS} items`, () => {
    const items = Array.from({ length: MAX_BULK_QUICK_PRODUCTS + 1 }, (_, index) =>
      validBulkItem({ name: `Product ${index + 1}` }),
    );
    const result = bulkProductQuickCreateSchema.safeParse({ items });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid product row", () => {
    expect(
      bulkProductQuickCreateSchema.safeParse({
        items: [validBulkItem({ name: "" })],
      }).success,
    ).toBe(false);
    expect(
      bulkProductQuickCreateSchema.safeParse({
        items: [validBulkItem({ categoryId: "not-real" })],
      }).success,
    ).toBe(false);
    expect(
      bulkProductQuickCreateSchema.safeParse({
        items: [validBulkItem({ image: validBulkImage({ type: "image/gif" }) })],
      }).success,
    ).toBe(false);
  });

  it("validates every category against known category ids", () => {
    expect(
      bulkProductQuickCreateSchema.safeParse({
        items: [
          validBulkItem({ categoryId: "hampers" }),
          validBulkItem({ name: "Bouquet", categoryId: "bouquets" }),
        ],
      }).success,
    ).toBe(true);
    expect(
      bulkProductQuickCreateSchema.safeParse({
        items: [validBulkItem({ categoryId: "mystery" })],
      }).success,
    ).toBe(false);
  });

  it("reuses the shared image upload payload schema", () => {
    const image = validBulkImage();
    expect(imageUploadPayloadSchema.safeParse(image).success).toBe(true);
    expect(
      bulkProductQuickCreateSchema.safeParse({
        items: [validBulkItem({ image })],
      }).success,
    ).toBe(true);
    expect(imageUploadPayloadSchema.safeParse({ ...image, type: "image/gif" }).success).toBe(false);
  });

  it("accepts a valid batch within the limit", () => {
    const result = bulkProductQuickCreateSchema.safeParse({
      items: [validBulkItem({ priceFrom: "1800" }), validBulkItem({ name: "Second" })],
    });
    expect(result.success).toBe(true);
  });
});

describe("buildBulkQuickProductInsertRows", () => {
  it("creates hidden drafts that are not homepage featured", () => {
    const parsed = bulkProductQuickCreateSchema.parse({
      items: [validBulkItem({ name: "Draft One", priceFrom: "1200" })],
    });
    const rows = buildBulkQuickProductInsertRows(parsed.items, []);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: "Draft One",
      categoryId: "hampers",
      blurb: "Draft One",
      description: "Draft One",
      details: [],
      priceFrom: "1200",
      isActive: false,
      featuredOnHomepage: false,
      homepageSortOrder: 0,
    });
    expect(rows[0]?.slug).toBe("draft-one");
  });

  it("allocates unique slugs for similar names against existing slugs", () => {
    const parsed = bulkProductQuickCreateSchema.parse({
      items: [validBulkItem({ name: "Gift Box" }), validBulkItem({ name: "Gift Box" })],
    });
    const rows = buildBulkQuickProductInsertRows(parsed.items, ["gift-box"]);
    expect(rows.map((row) => row.slug)).toEqual(["gift-box-2", "gift-box-3"]);
    expect(rows.every((row) => row.isActive === false)).toBe(true);
    expect(rows.every((row) => row.featuredOnHomepage === false)).toBe(true);
  });
});

describe("normal product editor validation stays strict", () => {
  it("still requires blurb, description, and details for the full editor", () => {
    const incomplete = {
      id: "new" as const,
      slug: "draft",
      name: "Draft",
      categoryId: "hampers" as const,
      blurb: "",
      description: "",
      details: "",
      isActive: false,
      featuredOnHomepage: false,
    };
    expect(productInputSchema.safeParse(incomplete).success).toBe(false);
  });
});

describe("duplicate product field rules", () => {
  it("copies display name with Copy suffix and allocates a new slug", () => {
    const originalName = "Ribbon Wrap Hamper";
    const name = duplicateProductDisplayName(originalName);
    const [slug] = allocateUniqueProductSlugs([name], ["ribbon-wrap-hamper"]);
    expect(name).toBe("Ribbon Wrap Hamper Copy");
    expect(slug).toBe("ribbon-wrap-hamper-copy");
    expect(slug).not.toBe("ribbon-wrap-hamper");
  });

  it("requires a positive product id", () => {
    expect(duplicateProductInputSchema.safeParse({ id: 12 }).success).toBe(true);
    expect(duplicateProductInputSchema.safeParse({ id: 0 }).success).toBe(false);
  });
});

describe("bulk and duplicate product server safety", () => {
  const productsApi = readFileSync(
    path.join(process.cwd(), "src/lib/api/admin/products.ts"),
    "utf8",
  );
  const uploadsServer = readFileSync(path.join(process.cwd(), "src/lib/uploads.server.ts"), "utf8");

  it("requires admin for bulk create and duplicate", () => {
    expect(productsApi).toMatch(
      /export const bulkCreateAdminProducts = createServerFn[\s\S]*?await requireAdmin\(\)/,
    );
    expect(productsApi).toMatch(
      /export const duplicateAdminProduct = createServerFn[\s\S]*?await requireAdmin\(\)/,
    );
  });

  it("rolls back created rows and orphan uploads on bulk failure", () => {
    expect(productsApi).toContain("uploadedPaths");
    expect(productsApi).toContain("createdIds");
    expect(productsApi).toMatch(
      /bulkCreateAdminProducts[\s\S]*catch \(error\)[\s\S]*db\.delete\(productsTable\)/,
    );
    expect(productsApi).toMatch(
      /bulkCreateAdminProducts[\s\S]*catch \(error\)[\s\S]*deleteUploadedImage/,
    );
  });

  it("copies product images for duplicates instead of sharing paths", () => {
    expect(productsApi).toContain("copyUploadedProductImage");
    expect(productsApi).toMatch(
      /duplicateAdminProduct[\s\S]*imagePath = await copyUploadedProductImage/,
    );
    expect(uploadsServer).toContain("copyUploadedProductImage");
    expect(uploadsServer).toMatch(/return `\/uploads\/products\/\$\{filename\}`/);
    expect(uploadsServer).toContain("copy-");
  });

  it("delete path remains per-product imagePath (no shared reference)", () => {
    expect(productsApi).toMatch(
      /deleteAdminProduct[\s\S]*deleteUploadedImage\(product\.imagePath\)/,
    );
  });
});
