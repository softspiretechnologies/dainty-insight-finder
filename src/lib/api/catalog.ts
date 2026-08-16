import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  getCategories,
  getFeaturedHomepageProducts,
  getProductBySlug,
  getProducts,
  getServicesPageData,
  getSiteSettings,
  getTestimonialsSection,
} from "@/lib/data.server";

export const getRootPageData = createServerFn({ method: "GET" }).handler(async () => {
  const [categories, siteSettings] = await Promise.all([getCategories(), getSiteSettings()]);
  return { categories, siteSettings };
});

export const getCatalogProducts = createServerFn({ method: "GET" }).handler(async () =>
  getProducts(),
);

export const getProductBySlugData = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => getProductBySlug(data.slug));

export const getSitemapProducts = createServerFn({ method: "GET" }).handler(async () =>
  getProducts(),
);

export const getServicesPageDataFn = createServerFn({ method: "GET" }).handler(async () =>
  getServicesPageData(),
);

export const getHomeTestimonials = createServerFn({ method: "GET" }).handler(async () =>
  getTestimonialsSection(),
);

export const getHomeGallery = createServerFn({ method: "GET" }).handler(async () =>
  getFeaturedHomepageProducts(),
);
