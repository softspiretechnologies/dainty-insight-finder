import { describe, expect, it } from "vitest";

import {
  ADMIN_MANIFEST_HREF,
  PUBLIC_MANIFEST_HREF,
  isAdminRouteId,
  matchesIncludeAdmin,
  resolvePwaIdentity,
} from "@/lib/pwa-identity";

describe("pwa identity", () => {
  it("detects admin route ids including login and nested pages", () => {
    expect(isAdminRouteId("/admin")).toBe(true);
    expect(isAdminRouteId("/admin/login")).toBe(true);
    expect(isAdminRouteId("/admin/products")).toBe(true);
    expect(isAdminRouteId("/")).toBe(false);
    expect(isAdminRouteId("/catalog")).toBe(false);
  });

  it("resolves from match lists without false positives", () => {
    expect(matchesIncludeAdmin([{ routeId: "__root__" }, { routeId: "/" }])).toBe(false);
    expect(
      matchesIncludeAdmin([
        { routeId: "__root__" },
        { routeId: "/admin" },
        { routeId: "/admin/products/" },
      ]),
    ).toBe(true);
  });

  it("keeps distinct public and admin install identities", () => {
    const publicIdentity = resolvePwaIdentity(false);
    const adminIdentity = resolvePwaIdentity(true);

    expect(publicIdentity.manifestHref).toBe(PUBLIC_MANIFEST_HREF);
    expect(publicIdentity.appleWebAppTitle).toBe("DaintyHand");
    expect(publicIdentity.applicationName).toBe("DaintyHand");

    expect(adminIdentity.manifestHref).toBe(ADMIN_MANIFEST_HREF);
    expect(adminIdentity.appleWebAppTitle).toBe("DaintyHand Admin");
    expect(adminIdentity.applicationName).toBe("DaintyHand Admin");
    expect(adminIdentity.title).toBe("DaintyHand Admin");
  });
});
