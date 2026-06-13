import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import type { CatalogCategory, SiteSettingsData } from "./types/catalog";

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: {
      categories: [] as CatalogCategory[],
      siteSettings: {} as SiteSettingsData,
    },
    scrollRestoration: true,
    defaultPreloadStaleTime: 30_000,
  });

  return router;
};
