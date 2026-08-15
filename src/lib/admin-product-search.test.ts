import { describe, expect, it } from "vitest";

import {
  adminProductSearchHasFilters,
  adminProductSearchSchema,
  buildAdminProductSearch,
  categoriesFromSearch,
  categoriesToSearchParam,
  clearAdminProductSearch,
  statusFromSearch,
} from "@/lib/admin-product-search";

describe("admin product search params", () => {
  it("parses status and categories from URL shapes", () => {
    const parsed = adminProductSearchSchema.parse({
      q: "hamper",
      status: "active",
      categories: ["wedding", "gifts"],
    });
    expect(statusFromSearch(parsed.status)).toBe("active");
    expect([...categoriesFromSearch(parsed.categories)].sort()).toEqual(["gifts", "wedding"]);
  });

  it("treats missing status as all", () => {
    expect(statusFromSearch(undefined)).toBe("all");
    expect(adminProductSearchSchema.parse({}).status).toBeUndefined();
  });

  it("round-trips category sets and omits defaults", () => {
    expect(categoriesToSearchParam(new Set())).toBeUndefined();
    expect(categoriesToSearchParam(new Set(["wedding"]))).toBe("wedding");
    expect(categoriesToSearchParam(new Set(["b", "a"]))).toEqual(["a", "b"]);

    expect(
      buildAdminProductSearch({
        q: "  hamper  ",
        status: "all",
        categories: new Set(),
      }),
    ).toEqual({ q: "hamper" });

    expect(
      buildAdminProductSearch({
        q: "",
        status: "featured",
        categories: new Set(["wedding"]),
      }),
    ).toEqual({ status: "featured", categories: "wedding" });
  });

  it("detects active filters and clears them", () => {
    expect(adminProductSearchHasFilters({ q: "x" })).toBe(true);
    expect(adminProductSearchHasFilters({ status: "hidden" })).toBe(true);
    expect(adminProductSearchHasFilters({})).toBe(false);
    expect(clearAdminProductSearch()).toEqual({});
  });
});
