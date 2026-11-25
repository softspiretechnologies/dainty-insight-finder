import { describe, expect, it } from "vitest";

import { catalogPath, getCatalogSeo, productSeoTitle } from "./catalog-seo";
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
