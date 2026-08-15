export type AdminMobileSection = "home" | "enquiries" | "products" | "more";

const MORE_PREFIXES = [
  "/admin/categories",
  "/admin/services",
  "/admin/blog",
  "/admin/testimonials",
  "/admin/settings",
] as const;

export function resolveAdminMobileSection(pathname: string): AdminMobileSection {
  const path = pathname.replace(/\/$/, "") || "/";
  if (path === "/admin") return "home";
  if (path === "/admin/enquiries" || path.startsWith("/admin/enquiries/")) return "enquiries";
  if (path === "/admin/products" || path.startsWith("/admin/products/")) return "products";
  if (MORE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return "more";
  }
  return "home";
}

export function adminPageTitle(pathname: string) {
  const path = pathname.replace(/\/$/, "") || "/";
  if (path === "/admin") return "Home";
  if (path.startsWith("/admin/enquiries")) return "Enquiries";
  if (path.startsWith("/admin/products")) return "Products";
  if (path.startsWith("/admin/categories")) return "Categories";
  if (path.startsWith("/admin/services")) return "Services";
  if (path.startsWith("/admin/blog")) return "Blog";
  if (path.startsWith("/admin/testimonials")) return "Testimonials";
  if (path.startsWith("/admin/settings")) return "Settings";
  return "Admin";
}
