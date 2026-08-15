/** Public vs Admin Home Screen / PWA identity for document head. */

export const PUBLIC_MANIFEST_HREF = "/manifest.webmanifest";
export const ADMIN_MANIFEST_HREF = "/admin.webmanifest";

export function isAdminRouteId(routeId: string): boolean {
  return routeId === "/admin" || routeId.startsWith("/admin/");
}

export function matchesIncludeAdmin(matches: ReadonlyArray<{ routeId: string }>): boolean {
  return matches.some((match) => isAdminRouteId(match.routeId));
}

export function resolvePwaIdentity(isAdmin: boolean) {
  if (isAdmin) {
    return {
      title: "DaintyHand Admin",
      applicationName: "DaintyHand Admin",
      appleWebAppTitle: "DaintyHand Admin",
      manifestHref: ADMIN_MANIFEST_HREF,
    } as const;
  }

  return {
    title: "DaintyHand — Handcrafted Gifts & Wedding Studio",
    applicationName: "DaintyHand",
    appleWebAppTitle: "DaintyHand",
    manifestHref: PUBLIC_MANIFEST_HREF,
  } as const;
}
