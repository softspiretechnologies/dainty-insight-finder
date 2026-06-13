import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getAdminSession } from "@/lib/auth.server";
import {
  getCategories,
  getProductBySlug,
  getProductCount,
  getProducts,
  getServicesPageData,
  getSiteSettings,
  getTestimonialsSection,
} from "@/lib/data.server";

function requireAdmin() {
  const session = getAdminSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export const getRootPageData = createServerFn({ method: "GET" }).handler(async () => {
  const [categories, siteSettings] = await Promise.all([getCategories(), getSiteSettings()]);
  return { categories, siteSettings };
});

export const getCatalogProducts = createServerFn({ method: "GET" }).handler(async () => getProducts());

export const getProductBySlugData = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => getProductBySlug(data.slug));

export const getSitemapProducts = createServerFn({ method: "GET" }).handler(async () => getProducts());

export const getAdminDashboardData = createServerFn({ method: "GET" }).handler(async () => {
  requireAdmin();
  return {
    productCount: await getProductCount(),
  };
});

export const getServicesPageDataFn = createServerFn({ method: "GET" }).handler(async () =>
  getServicesPageData(),
);

export const getHomeTestimonials = createServerFn({ method: "GET" }).handler(async () =>
  getTestimonialsSection(),
);
