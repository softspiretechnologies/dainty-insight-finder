import { describe, expect, it } from "vitest";

import { categoryInputSchema, loginSchema, productInputSchema } from "@/lib/admin-schemas";

const validProduct = {
  id: "new" as const,
  slug: "ribbon-wrap-hamper",
  name: "Ribbon Wrap Hamper",
  categoryId: "hampers" as const,
  blurb: "A cream box tied in satin.",
  description: "Hand-wrapped hamper.",
  details: "Satin ribbon\nHand-written note",
  isActive: true,
  featuredOnHomepage: false,
};

describe("loginSchema", () => {
  it("requires a valid email and password", () => {
    expect(loginSchema.safeParse({ email: "admin@example.com", password: "secret" }).success).toBe(
      true,
    );
    expect(loginSchema.safeParse({ email: "not-an-email", password: "secret" }).success).toBe(
      false,
    );
    expect(loginSchema.safeParse({ email: "admin@example.com", password: "" }).success).toBe(false);
  });
});

describe("productInputSchema", () => {
  it("accepts a valid product payload", () => {
    expect(productInputSchema.safeParse(validProduct).success).toBe(true);
  });

  it("rejects invalid slugs and categories", () => {
    expect(productInputSchema.safeParse({ ...validProduct, slug: "Nope Slug" }).success).toBe(
      false,
    );
    expect(productInputSchema.safeParse({ ...validProduct, categoryId: "unknown" }).success).toBe(
      false,
    );
  });

  it("requires isActive and featuredOnHomepage booleans", () => {
    const { isActive: _isActive, ...withoutActive } = validProduct;
    expect(productInputSchema.safeParse(withoutActive).success).toBe(false);
  });
});

describe("categoryInputSchema", () => {
  it("accepts a known category id", () => {
    expect(
      categoryInputSchema.safeParse({
        id: "hampers",
        label: "Custom Hampers",
        blurb: "Luxury hampers",
        sortOrder: 0,
      }).success,
    ).toBe(true);
  });

  it("rejects an unknown category id", () => {
    expect(
      categoryInputSchema.safeParse({
        id: "not-a-category",
        label: "X",
        blurb: "Y",
        sortOrder: 0,
      }).success,
    ).toBe(false);
  });
});
