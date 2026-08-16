import { describe, expect, it } from "vitest";

import { formatAdminDateTime, formatEnquiryBadgeCount } from "@/lib/admin-format";
import { adminPageTitle, resolveAdminMobileSection } from "@/lib/admin-nav";
import { canMoveItem, planReorderMove } from "@/lib/admin-reorder";
import { enquirySourceLabel } from "@/lib/enquiries";
import { adminSettingsFormSchema } from "@/lib/admin-schemas";

describe("admin format helpers", () => {
  it("formats today and yesterday", () => {
    const now = new Date("2026-08-15T15:00:00");
    expect(formatAdminDateTime("2026-08-15T11:20:00", now)).toMatch(/^Today,/);
    expect(formatAdminDateTime("2026-08-14T16:35:00", now)).toMatch(/^Yesterday,/);
  });

  it("caps enquiry badges", () => {
    expect(formatEnquiryBadgeCount(0)).toBeNull();
    expect(formatEnquiryBadgeCount(3)).toBe("3");
    expect(formatEnquiryBadgeCount(120)).toBe("99+");
  });
});

describe("admin mobile section", () => {
  it("resolves primary and more sections", () => {
    expect(resolveAdminMobileSection("/admin")).toBe("home");
    expect(resolveAdminMobileSection("/admin/enquiries/12")).toBe("enquiries");
    expect(resolveAdminMobileSection("/admin/products/new")).toBe("products");
    expect(resolveAdminMobileSection("/admin/products/bulk")).toBe("products");
    expect(resolveAdminMobileSection("/admin/settings")).toBe("more");
    expect(adminPageTitle("/admin/blog")).toBe("Blog");
    expect(adminPageTitle("/admin/products/bulk")).toBe("Products");
  });
});

describe("reorder planner", () => {
  const items = [
    { id: "a", sortOrder: 0 },
    { id: "b", sortOrder: 1 },
    { id: "c", sortOrder: 2 },
  ];

  it("moves items up and down", () => {
    expect(planReorderMove(items, "b", "up")?.map((item) => item.id)).toEqual(["b", "a", "c"]);
    expect(planReorderMove(items, "b", "down")?.map((item) => item.id)).toEqual(["a", "c", "b"]);
  });

  it("blocks first/last moves", () => {
    expect(canMoveItem(items, "a", "up")).toBe(false);
    expect(canMoveItem(items, "c", "down")).toBe(false);
  });
});

describe("enquiry source labels", () => {
  it("uses friendly labels", () => {
    expect(enquirySourceLabel("product")).toBe("Product enquiry");
    expect(enquirySourceLabel("contact")).toBe("Contact page");
  });
});

describe("whatsapp settings normalization", () => {
  it("accepts spaced and plus-prefixed numbers", () => {
    const result = adminSettingsFormSchema.safeParse({
      whatsappNumber: "+91 98765 43210",
      email: "hello@example.com",
      instagramUrl: "https://instagram.com/dainty.handd",
      instagramHandle: "@dainty.handd",
      founder: "Nafisa",
      location: "Kerala",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.whatsappNumber).toBe("919876543210");
  });
});
