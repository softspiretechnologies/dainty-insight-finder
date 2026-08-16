import type { CatalogCategory, SiteSettingsData } from "@/types/catalog";

/** Typed empty root context so Admin navigation does not fetch public catalog/settings. */
export const EMPTY_ADMIN_ROOT_CONTEXT: {
  categories: CatalogCategory[];
  siteSettings: SiteSettingsData;
} = {
  categories: [],
  siteSettings: {
    whatsappNumber: "",
    email: "",
    instagramUrl: "",
    instagramHandle: "",
    founder: "",
    location: "",
    servicesIntro: "",
    servicesFooterTitle: "",
    servicesFooterBlurb: "",
  },
};

export function normalizePathname(pathname: string) {
  const path = pathname.replace(/\/$/, "") || "/";
  return path;
}

export function isAdminPath(pathname: string) {
  const path = normalizePathname(pathname);
  return path === "/admin" || path.startsWith("/admin/");
}

export function isAdminLoginPath(pathname: string) {
  return normalizePathname(pathname) === "/admin/login";
}

/** Public pages need categories + site settings; Admin does not. */
export function shouldLoadPublicRootContext(pathname: string) {
  return !isAdminPath(pathname);
}

/**
 * UI session guard only. Server functions remain the authorization boundary.
 * `stay` = already inside the Admin tree; do not block child loaders with another session fetch.
 */
export function shouldValidateAdminSession(pathname: string, cause: string) {
  if (isAdminLoginPath(pathname)) return false;
  if (!isAdminPath(pathname)) return false;
  return cause !== "stay";
}
