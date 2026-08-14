import { describe, expect, it } from "vitest";

import {
  MAX_HOMEPAGE_FEATURED,
  assertHomepageFeaturedCount,
  canAddHomepageFeature,
  featuredDisabledState,
  wantsHomepageFeature,
} from "@/lib/homepage-featured";

describe("homepage featured limit", () => {
  it("caps featured products at six", () => {
    expect(MAX_HOMEPAGE_FEATURED).toBe(6);
    expect(canAddHomepageFeature(5)).toBe(true);
    expect(canAddHomepageFeature(6)).toBe(false);
    expect(() => assertHomepageFeaturedCount(6)).toThrow(/Maximum 6 products/);
  });

  it("does not feature inactive products", () => {
    expect(wantsHomepageFeature(false, true)).toBe(false);
    expect(wantsHomepageFeature(true, true)).toBe(true);
    expect(featuredDisabledState()).toEqual({
      featuredOnHomepage: false,
      homepageSortOrder: 0,
    });
  });
});
