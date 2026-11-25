import { describe, expect, it } from "vitest";

import {
  catalogPath,
  getCatalogSeo,
  getProductSeo,
  productSeoTitle,
  serializeCatalogJsonLd,
} from "./catalog-seo";
import type { CategoryId } from "@/types/catalog";

const products = Array.from({ length: 13 }, () => ({ category: "hampers" as CategoryId }));

describe("catalog SEO", () => {
  it("gives populated categories unique metadata and canonical URLs", () => {
    const hampers = getCatalogSeo({ category: "hampers" }, products);
    expect(hampers.indexable).toBe(true);
    expect(hampers.title).toContain("Malappuram");
    expect(hampers.canonicalPath).toBe("/catalog?category=hampers");
    expect(getCatalogSeo({}, products).title).not.toBe(hampers.title);
  });

  it("normalizes the first page and keeps valid subsequent pages indexable", () => {
    expect(catalogPath("hampers", 1)).toBe("/catalog?category=hampers");
    expect(getCatalogSeo({ category: "hampers", page: 2 }, products)).toMatchObject({
      indexable: true,
      canonicalPath: "/catalog?category=hampers&page=2",
    });
  });

  it("does not index empty, combined or out-of-range filters", () => {
    expect(getCatalogSeo({ category: "bouquets" }, products).indexable).toBe(false);
    expect(getCatalogSeo({ category: ["hampers", "bouquets"] }, products).indexable).toBe(false);
    expect(getCatalogSeo({ page: 3 }, products).canonicalPath).toBeUndefined();
  });

  it("uses the actual product category in titles", () => {
    expect(productSeoTitle("Chocolate Delight", "bouquets")).toContain("Custom Bouquets");
  });
});

describe("SEO overrides", () => {
  const product = {
    name: "Ribbon Gift",
    category: "hampers" as const,
    description: "A handmade gift hamper for a special occasion.",
    blurb: "Handmade gift",
  };

  it("uses custom product metadata and falls back for blank values", () => {
    const defaults = getProductSeo(product);
    expect(getProductSeo({ ...product, metaTitle: "  ", metaDescription: "" })).toEqual(defaults);
    expect(
      getProductSeo({
        ...product,
        metaTitle: "  A custom gift title  ",
        metaDescription: "A custom gift description.",
      }),
    ).toEqual({
      title: "A custom gift title",
      description: "A custom gift description.",
    });
  });

  it("uses category overrides only for that category and retains canonical rules", () => {
    const categories = [
      { id: "hampers", metaTitle: "Luxury gift boxes", metaDescription: "Gift box ideas." },
    ];
    const defaults = getCatalogSeo({ category: "hampers" }, products);
    const seo = getCatalogSeo({ category: "hampers" }, products, categories);
    expect(seo).toMatchObject({
      title: "Luxury gift boxes",
      description: "Gift box ideas.",
      heading: defaults.heading,
      intro: defaults.intro,
      canonicalPath: defaults.canonicalPath,
    });
    expect(getCatalogSeo({ category: "hampers", page: 2 }, products, categories).title).toBe(
      "Luxury gift boxes | Page 2",
    );
    expect(getCatalogSeo({}, products, categories)).toEqual(getCatalogSeo({}, products));
    expect(
      getCatalogSeo({ category: ["hampers", "bouquets"] }, products, categories).indexable,
    ).toBe(false);
  });

  it("escapes script delimiters while preserving JSON-LD text", () => {
    const data = { description: "</script><script>alert(1)</script>" };
    const serialized = serializeCatalogJsonLd(data);
    expect(serialized).not.toContain("<");
    expect(JSON.parse(serialized)).toEqual(data);
  });
});
