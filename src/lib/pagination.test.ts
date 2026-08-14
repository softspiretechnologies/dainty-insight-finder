import { describe, expect, it } from "vitest";

import { getPaginationItems } from "./pagination";

describe("getPaginationItems", () => {
  it("returns every page for short result sets", () => {
    expect(getPaginationItems(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("condenses a desktop page range around the current page", () => {
    expect(getPaginationItems(5, 10, 1)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10]);
  });

  it("uses a smaller mobile range without losing boundary pages", () => {
    expect(getPaginationItems(5, 10, 0)).toEqual([1, "ellipsis", 5, "ellipsis", 10]);
  });

  it("clamps an invalid current page", () => {
    expect(getPaginationItems(20, 10, 0)).toEqual([1, "ellipsis", 10]);
  });
});
