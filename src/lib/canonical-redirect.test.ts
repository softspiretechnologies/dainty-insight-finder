import assert from "node:assert/strict";
import { describe, it } from "vitest";

import { getCanonicalRedirect } from "./canonical-redirect";

const origin = "https://daintyhand.in";

describe("canonical host redirect", () => {
  it("permanently redirects the www homepage to the configured origin", () => {
    const response = getCanonicalRedirect(new Request("https://www.daintyhand.in/"), origin, true);
    assert.equal(response?.status, 301);
    assert.equal(response?.headers.get("location"), "https://daintyhand.in/");
  });

  it("preserves path and query on public catalog and journal requests", () => {
    for (const path of [
      "/catalog?category=hampers&page=2&tag=a%2Fb&tag=c",
      "/blog/custom-wedding-hamper-ideas-kerala",
      "/sitemap.xml",
      "/robots.txt",
    ]) {
      const response = getCanonicalRedirect(
        new Request(`https://www.daintyhand.in${path}`, { method: "HEAD" }),
        origin,
        true,
      );
      assert.equal(response?.status, 301);
      assert.equal(response?.headers.get("location"), `${origin}${path}`);
    }
  });

  it("does not redirect the canonical host, unrelated hosts or local development", () => {
    for (const url of [
      "https://daintyhand.in/catalog",
      "https://www.daintyhand.in.example.com/catalog",
      "http://localhost:4173/catalog",
    ]) {
      assert.equal(getCanonicalRedirect(new Request(url), origin, true), undefined);
    }
    const alias = new Request("https://www.daintyhand.in/catalog");
    assert.equal(getCanonicalRedirect(alias, origin, false), undefined);
  });

  it("leaves admin, backend requests and non-read methods untouched", () => {
    for (const path of ["/admin", "/admin/login", "/health", "/_serverFn/test", "/uploads/a.jpg"]) {
      assert.equal(
        getCanonicalRedirect(new Request(`https://www.daintyhand.in${path}`), origin, true),
        undefined,
      );
    }
    const post = new Request("https://www.daintyhand.in/contact", { method: "POST" });
    assert.equal(getCanonicalRedirect(post, origin, true), undefined);
  });

  it("does not trust forwarded hosts or unsafe canonical configuration", () => {
    const request = new Request("https://daintyhand.in/catalog", {
      headers: { "x-forwarded-host": "www.daintyhand.in" },
    });
    assert.equal(getCanonicalRedirect(request, origin, true), undefined);
    const alias = new Request("https://www.daintyhand.in/catalog");
    for (const invalid of [
      undefined,
      "bad-url",
      "http://daintyhand.in",
      "https://www.daintyhand.in",
      "https://daintyhand.in/path",
    ]) {
      assert.equal(getCanonicalRedirect(alias, invalid, true), undefined);
    }
  });
});
