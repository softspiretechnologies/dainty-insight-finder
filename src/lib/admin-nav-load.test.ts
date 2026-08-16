import { describe, expect, it } from "vitest";

import { shouldLoadPublicRootContext, shouldValidateAdminSession } from "@/lib/admin-nav-load";

describe("shouldLoadPublicRootContext", () => {
  it("loads public catalog context on public routes", () => {
    expect(shouldLoadPublicRootContext("/")).toBe(true);
    expect(shouldLoadPublicRootContext("/catalog")).toBe(true);
    expect(shouldLoadPublicRootContext("/services")).toBe(true);
    expect(shouldLoadPublicRootContext("/blog/a-post")).toBe(true);
  });

  it("skips public root data on Admin paths", () => {
    expect(shouldLoadPublicRootContext("/admin")).toBe(false);
    expect(shouldLoadPublicRootContext("/admin/")).toBe(false);
    expect(shouldLoadPublicRootContext("/admin/products")).toBe(false);
    expect(shouldLoadPublicRootContext("/admin/enquiries/123")).toBe(false);
    expect(shouldLoadPublicRootContext("/admin/login")).toBe(false);
  });
});

describe("shouldValidateAdminSession", () => {
  it("validates when entering the Admin tree", () => {
    expect(shouldValidateAdminSession("/admin/products", "enter")).toBe(true);
    expect(shouldValidateAdminSession("/admin", "enter")).toBe(true);
    expect(shouldValidateAdminSession("/admin/enquiries/123", "preload")).toBe(true);
  });

  it("does not re-fetch the UI session while staying under /admin", () => {
    expect(shouldValidateAdminSession("/admin/products", "stay")).toBe(false);
    expect(shouldValidateAdminSession("/admin/enquiries", "stay")).toBe(false);
  });

  it("never validates the login route", () => {
    expect(shouldValidateAdminSession("/admin/login", "enter")).toBe(false);
    expect(shouldValidateAdminSession("/admin/login", "stay")).toBe(false);
  });
});
