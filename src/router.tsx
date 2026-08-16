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
    /** Preload matched route code + loaders on Link hover/focus/touch intent. */
    defaultPreload: "intent",
    defaultPreloadStaleTime: 30_000,
    // Public routes keep the framework default freshness (0). Admin routes set
    // short staleTime explicitly where back-nav caching helps.
  });

  return router;
};
