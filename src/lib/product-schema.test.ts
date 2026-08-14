import { describe, expect, it } from "vitest";

import { buildProductStructuredData, parseProductPrice } from "./product-schema";
import type { CatalogProduct } from "@/types/catalog";

const product: CatalogProduct = {
  id: 1,
  slug: "example",
  name: "Example",
  category: "hampers",
  blurb: "A product",
  description: "A real product",
  details: [],
  image: "/uploads/products/example.jpg",
};

describe("product structured data", () => {
  it("omits offers and review claims without stored data", () => {
    const schema = buildProductStructuredData(product, product.description);
    expect(schema).not.toHaveProperty("offers");
    expect(schema).not.toHaveProperty("aggregateRating");
    expect(schema).not.toHaveProperty("review");
    expect(schema.image).toMatch(/\/uploads\/products\/example\.jpg$/);
  });

  it("includes offers only for a positive numeric price", () => {
    expect(
      buildProductStructuredData({ ...product, priceFrom: "₹1,500" }, "description"),
    ).toMatchObject({
      offers: { price: "1500", priceCurrency: "INR" },
    });
    expect(parseProductPrice("Contact us")).toBeUndefined();
    expect(parseProductPrice("0")).toBeUndefined();
  });
});
