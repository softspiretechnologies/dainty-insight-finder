import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db/index.server", () => ({
  isDatabaseConfigured: vi.fn(),
  getDb: vi.fn(),
}));

vi.mock("@/data/products", () => ({
  categories: [
    { id: "hampers", label: "Custom Hampers", blurb: "Luxury hampers", image: "/c.jpg" },
  ],
  products: [
    {
      id: 1,
      slug: "fallback-hamper",
      name: "Fallback hamper",
      category: "hampers",
      blurb: "Static catalog item",
      description: "Used when MySQL is unavailable",
      details: ["Satin ribbon"],
      image: "/p.jpg",
    },
  ],
}));

import { getDb, isDatabaseConfigured } from "@/db/index.server";
import { clearDataCache, getCategories, getProductBySlug, getProducts } from "@/lib/data.server";

describe("public catalog fallback", () => {
  beforeEach(() => {
    clearDataCache();
    vi.mocked(isDatabaseConfigured).mockReset();
    vi.mocked(getDb).mockReset();
  });

  it("returns static products when the database is not configured", async () => {
    vi.mocked(isDatabaseConfigured).mockReturnValue(false);
    const products = await getProducts();
    expect(products.map((p) => p.slug)).toEqual(["fallback-hamper"]);
    expect(getDb).not.toHaveBeenCalled();
  });

  it("returns static products when a database query fails", async () => {
    vi.mocked(isDatabaseConfigured).mockReturnValue(true);
    vi.mocked(getDb).mockImplementation(() => {
      throw new Error("ECONNREFUSED");
    });
    const products = await getProducts();
    expect(products[0]?.name).toBe("Fallback hamper");
  });

  it("falls back to static categories and product-by-slug lookups", async () => {
    vi.mocked(isDatabaseConfigured).mockReturnValue(false);
    const categories = await getCategories();
    const product = await getProductBySlug("fallback-hamper");
    expect(categories[0]?.id).toBe("hampers");
    expect(product?.slug).toBe("fallback-hamper");
  });
});
