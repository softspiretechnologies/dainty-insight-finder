import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

import { emptyEnquiryStatusCounts, emptyEnquirySummary } from "@/lib/admin-enquiry-queries.server";

const productEditorIdSchema = z.object({
  productId: z.union([
    z.literal("new"),
    z
      .string()
      .regex(/^\d+$/, "Invalid product id")
      .transform((value) => Number(value))
      .pipe(z.number().int().positive()),
  ]),
});

describe("admin enquiry page-data helpers", () => {
  it("empty enquiry counts have no recent rows", () => {
    const counts = emptyEnquiryStatusCounts();
    expect(counts).toEqual({
      all: 0,
      new: 0,
      contacted: 0,
      quoted: 0,
      confirmed: 0,
      lost: 0,
    });
    expect(emptyEnquirySummary()).toEqual({ ...counts, recent: [] });
  });
});

describe("admin product editor id schema", () => {
  it("accepts new and numeric product ids", () => {
    expect(productEditorIdSchema.parse({ productId: "new" }).productId).toBe("new");
    expect(productEditorIdSchema.parse({ productId: "42" }).productId).toBe(42);
  });

  it("rejects invalid product ids", () => {
    expect(productEditorIdSchema.safeParse({ productId: "abc" }).success).toBe(false);
    expect(productEditorIdSchema.safeParse({ productId: "0" }).success).toBe(false);
  });
});

describe("admin page-data server functions", () => {
  const enquiriesApi = readFileSync(
    path.join(process.cwd(), "src/lib/api/admin/enquiries.ts"),
    "utf8",
  );
  const productsApi = readFileSync(
    path.join(process.cwd(), "src/lib/api/admin/products.ts"),
    "utf8",
  );
  const adminLayout = readFileSync(path.join(process.cwd(), "src/routes/admin.tsx"), "utf8");
  const adminIndex = readFileSync(path.join(process.cwd(), "src/routes/admin.index.tsx"), "utf8");
  const productsIndex = readFileSync(
    path.join(process.cwd(), "src/routes/admin.products.index.tsx"),
    "utf8",
  );
  const productEditor = readFileSync(
    path.join(process.cwd(), "src/routes/admin.products.$productId.tsx"),
    "utf8",
  );
  const productsBulk = readFileSync(
    path.join(process.cwd(), "src/routes/admin.products.bulk.tsx"),
    "utf8",
  );
  const enquiriesIndex = readFileSync(
    path.join(process.cwd(), "src/routes/admin.enquiries.index.tsx"),
    "utf8",
  );
  const blogEditor = readFileSync(
    path.join(process.cwd(), "src/routes/admin.blog.$postId.tsx"),
    "utf8",
  );
  const router = readFileSync(path.join(process.cwd(), "src/router.tsx"), "utf8");

  it("protects new page-data endpoints with requireAdmin", () => {
    for (const name of [
      "getAdminNewEnquiryCount",
      "getAdminDashboardPageData",
      "getAdminEnquiriesPageData",
    ]) {
      expect(enquiriesApi).toContain(`export const ${name}`);
      expect(enquiriesApi).toMatch(
        new RegExp(`export const ${name} = createServerFn[\\s\\S]*?await requireAdmin\\(\\)`),
      );
    }
    for (const name of ["getAdminProductsPageData", "getAdminProductEditorData"]) {
      expect(productsApi).toContain(`export const ${name}`);
      expect(productsApi).toMatch(
        new RegExp(`export const ${name} = createServerFn[\\s\\S]*?await requireAdmin\\(\\)`),
      );
    }
  });

  it("shell badge uses the cheap new-count endpoint, not full summary", () => {
    expect(adminLayout).toContain("getAdminNewEnquiryCount");
    expect(adminLayout).not.toContain("getAdminEnquirySummary");
    expect(enquiriesApi).toMatch(/getAdminNewEnquiryCount[\s\S]*safeNewEnquiryCount/);
  });

  it("dashboard uses a single page-data call without a second summary fetch", () => {
    expect(adminIndex).toContain("getAdminDashboardPageData");
    expect(adminIndex).not.toContain("getAdminEnquirySummary");
    expect(adminIndex).not.toContain("getAdminDashboardData");
  });

  it("products list and editor use consolidated page-data loaders", () => {
    expect(productsIndex).toContain("getAdminProductsPageData");
    expect(productsIndex).not.toContain("listAdminProducts()");
    expect(productsIndex).not.toContain("listAdminCategories");
    expect(productEditor).toContain("getAdminProductEditorData");
    expect(productEditor).not.toContain("listAdminCategories");
  });

  it("enquiries list uses one page-data endpoint", () => {
    expect(enquiriesIndex).toContain("getAdminEnquiriesPageData");
    expect(enquiriesIndex).not.toContain("listAdminEnquiries");
    expect(enquiriesIndex).not.toContain("getAdminEnquirySummary");
  });

  it("enables intent route preloading without a global defaultStaleTime", () => {
    expect(router).toContain('defaultPreload: "intent"');
    expect(router).toContain("defaultPreloadStaleTime: 30_000");
    expect(router).not.toMatch(/defaultStaleTime\s*:/);
  });

  it("keeps short staleTime only on selected Admin routes", () => {
    expect(adminLayout).toContain("staleTime: 15_000");
    expect(adminIndex).toContain("staleTime: 15_000");
    expect(productsIndex).toContain("staleTime: 15_000");
    expect(productEditor).toContain("staleTime: 15_000");
    expect(enquiriesIndex).toContain("staleTime: 10_000");
  });

  it("invalidates router data before returning to the cached products list after save", () => {
    expect(productEditor).toMatch(
      /saveAdminProduct\([\s\S]*?await router\.invalidate\(\);[\s\S]*?navigate\(\{\s*to:\s*"\/admin\/products"/,
    );
  });

  it("invalidates router data after successful bulk create before View products", () => {
    expect(productsBulk).toMatch(
      /bulkCreateAdminProducts\([\s\S]*?await router\.invalidate\(\);[\s\S]*?setSuccessCount/,
    );
  });

  it("does not require blog save invalidation while blog list uses default staleTime 0", () => {
    expect(blogEditor).toContain('navigate({ to: "/admin/blog" })');
    const blogIndex = readFileSync(
      path.join(process.cwd(), "src/routes/admin.blog.index.tsx"),
      "utf8",
    );
    expect(blogIndex).not.toMatch(/staleTime:\s*\d/);
  });
});
