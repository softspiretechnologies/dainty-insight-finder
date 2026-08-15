import { describe, expect, it } from "vitest";

import { parseProductPrice } from "@/lib/product-schema";
import {
  formatProductPrice,
  formatProductPriceFrom,
  isValidProductPriceInput,
  normalizeProductPriceInput,
  productPriceInputValue,
} from "@/lib/product-price";

describe("product price helpers", () => {
  it("parses legacy and plain amounts", () => {
    expect(parseProductPrice("1800")).toBe("1800");
    expect(parseProductPrice("₹1800")).toBe("1800");
    expect(parseProductPrice("₹1,800")).toBe("1800");
    expect(parseProductPrice("From ₹1800")).toBe("1800");
    expect(parseProductPrice("INR 1800")).toBe("1800");
    expect(parseProductPrice("")).toBeUndefined();
    expect(parseProductPrice("abc")).toBeUndefined();
  });

  it("normalizes save values and input display", () => {
    expect(normalizeProductPriceInput("₹1,800")).toBe("1800");
    expect(normalizeProductPriceInput("  ")).toBeUndefined();
    expect(productPriceInputValue("₹3,000")).toBe("3000");
    expect(productPriceInputValue(undefined)).toBe("");
  });

  it("formats admin and public prices", () => {
    expect(formatProductPrice("1800")).toBe("₹1,800");
    expect(formatProductPrice("₹1800")).toBe("₹1,800");
    expect(formatProductPrice("₹1,800")).toBe("₹1,800");
    expect(formatProductPriceFrom("1800")).toBe("From ₹1,800");
    expect(formatProductPriceFrom("From ₹1800")).toBe("From ₹1,800");
    expect(formatProductPrice(undefined)).toBeUndefined();
  });

  it("validates admin input", () => {
    expect(isValidProductPriceInput("")).toBe(true);
    expect(isValidProductPriceInput("1800")).toBe(true);
    expect(isValidProductPriceInput("1250.50")).toBe(true);
    expect(isValidProductPriceInput("abc")).toBe(false);
    expect(isValidProductPriceInput("₹₹")).toBe(false);
  });

  it("keeps non-numeric legacy strings readable", () => {
    expect(formatProductPrice("₹85 / suite")).toBe("₹85 / suite");
    expect(formatProductPriceFrom("₹85 / suite")).toBe("From ₹85 / suite");
  });
});
