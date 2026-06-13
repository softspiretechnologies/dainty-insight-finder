import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  getCategories,
  getProductBySlug,
  getProductCount,
  getProducts,
  getSiteSettings,
} from "@/lib/data.server";

export const getRootPageData = createServerFn({ method: "GET" }).handler(async () => {
  const [categories, siteSettings] = await Promise.all([getCategories(), getSiteSettings()]);
  return { categories, siteSettings };
});

export const getCatalogPageData = createServerFn({ method: "GET" }).handler(async () => {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  return { categories, products };
});

export const getProductPageData = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    const [product, categories] = await Promise.all([
      getProductBySlug(data.slug),
      getCategories(),
    ]);
    return { product, categories };
  });

export const getHomePageData = createServerFn({ method: "GET" }).handler(async () => ({
  categories: await getCategories(),
}));

export const getSitemapProducts = createServerFn({ method: "GET" }).handler(async () => getProducts());

export const getAdminDashboardData = createServerFn({ method: "GET" }).handler(async () => ({
  productCount: await getProductCount(),
}));
