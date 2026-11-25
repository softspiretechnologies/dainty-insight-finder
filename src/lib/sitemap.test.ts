import { describe, expect, it } from "vitest";
import { buildSitemapEntries, buildSitemapXml } from "./sitemap";

describe("sitemap", () => {
  it("includes only populated known categories and escapes XML URLs", () => {
    const entries = buildSitemapEntries(
      [{ slug: "gift", category: "hampers", updatedAt: new Date("2026-01-01T00:00:00Z") }],
      [{ slug: "gifting-guide" }],
      ["hampers", "bouquets", "unknown"],
    );
    const xml = buildSitemapXml("https://daintyhand.in", entries);
    expect(xml).toContain("/catalog?category=hampers");
    expect(xml).not.toContain("category=bouquets");
    expect(xml).toContain("<lastmod>2026-01-01T00:00:00.000Z</lastmod>");
    expect(
      buildSitemapXml("https://daintyhand.in", [{ path: "/catalog?category=hampers&page=2" }]),
    ).toContain("category=hampers&amp;page=2");
  });
});
