import { describe, expect, it } from "vitest";

import {
  adminBlogPostSchema,
  categoryInputSchema,
  loginSchema,
  productInputSchema,
} from "@/lib/admin-schemas";

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

describe("adminBlogPostSchema", () => {
  it("accepts a valid journal post", () => {
    expect(
      adminBlogPostSchema.safeParse({
        id: "new",
        title: "Hamper ideas",
        slug: "hamper-ideas",
        excerpt: "A short intro",
        content: "The full story",
        isPublished: false,
      }).success,
    ).toBe(true);
  });

  it("rejects an invalid slug", () => {
    expect(
      adminBlogPostSchema.safeParse({
        id: "new",
        title: "Hamper ideas",
        slug: "Nope Slug",
        excerpt: "A short intro",
        content: "The full story",
        isPublished: false,
      }).success,
    ).toBe(false);
  });
});

describe("optional SEO fields", () => {
  it("accepts missing fields, trims text and preserves explicit clears", () => {
    const input = productInputSchema.parse(validProduct);
    expect(input.metaTitle).toBeUndefined();
    expect(input.metaDescription).toBeUndefined();
    expect(
      productInputSchema.parse({ ...validProduct, metaTitle: "  Gift title  ", metaDescription: " " }),
    ).toMatchObject({ metaTitle: "Gift title", metaDescription: "" });
  });

  it("enforces limits on both product and category writes", () => {
    const category = {
      id: "hampers",
      label: "Custom Hampers",
      blurb: "Luxury hampers",
      sortOrder: 0,
    };
    for (const fields of [{ metaTitle: "x".repeat(121) }, { metaDescription: "x".repeat(321) }]) {
      expect(productInputSchema.safeParse({ ...validProduct, ...fields }).success).toBe(false);
      expect(categoryInputSchema.safeParse({ ...category, ...fields }).success).toBe(false);
    }
    expect(categoryInputSchema.parse({ ...category, metaTitle: " ", metaDescription: "" })).toMatchObject({
      metaTitle: "",
      metaDescription: "",
    });
  });
});
