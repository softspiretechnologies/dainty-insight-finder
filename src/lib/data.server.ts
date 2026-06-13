import { asc, count, eq } from "drizzle-orm";

import { getDb, isDatabaseConfigured } from "@/db/index.server";
import { categories as categoriesTable, products as productsTable, siteSettings } from "@/db/schema";
import {
  categories as staticCategories,
  products as staticProducts,
} from "@/data/products";
import { getCached } from "@/lib/cache.server";
import { normalizeProductDetails } from "@/lib/product-details";
import { site } from "@/lib/site";
import type { CatalogCategory, CatalogProduct, CategoryId, SiteSettingsData } from "@/types/catalog";

export { clearDataCache } from "@/lib/cache.server";

const staticSiteSettings = (): SiteSettingsData => ({
  whatsappNumber: site.whatsappNumber,
  email: site.email,
  instagramUrl: site.instagramUrl,
  instagramHandle: site.instagramHandle,
  founder: site.founder,
  location: site.location,
});

async function withDbFallback<T>(query: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await query();
  } catch {
    return fallback();
  }
}

function mapCategory(row: typeof categoriesTable.$inferSelect): CatalogCategory {
  return {
    id: row.id as CategoryId,
    label: row.label,
    blurb: row.blurb,
    image: row.imagePath,
  };
}

function mapProduct(row: typeof productsTable.$inferSelect): CatalogProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.categoryId as CategoryId,
    blurb: row.blurb,
    description: row.description,
    details: normalizeProductDetails(row.details),
    image: row.imagePath,
    priceFrom: row.priceFrom ?? undefined,
  };
}

export async function getCategories(): Promise<CatalogCategory[]> {
  if (!isDatabaseConfigured()) {
    return staticCategories.map((c) => ({ ...c }));
  }

  return getCached("categories", () =>
    withDbFallback(
      async () => {
        const db = getDb();
        const rows = await db.select().from(categoriesTable).orderBy(asc(categoriesTable.sortOrder));
        return rows.map(mapCategory);
      },
      () => staticCategories.map((c) => ({ ...c })),
    ),
  );
}

export async function getProducts(): Promise<CatalogProduct[]> {
  if (!isDatabaseConfigured()) {
    return staticProducts.map((p) => ({ ...p }));
  }

  return getCached("products", () =>
    withDbFallback(
      async () => {
        const db = getDb();
        const rows = await db.select().from(productsTable).orderBy(asc(productsTable.name));
        return rows.map(mapProduct);
      },
      () => staticProducts.map((p) => ({ ...p })),
    ),
  );
}

export async function getProductBySlug(slug: string): Promise<CatalogProduct | undefined> {
  if (!isDatabaseConfigured()) {
    return staticProducts.find((p) => p.slug === slug);
  }

  return getCached(`product:${slug}`, () =>
    withDbFallback(
      async () => {
        const db = getDb();
        const rows = await db.select().from(productsTable).where(eq(productsTable.slug, slug)).limit(1);
        return rows[0] ? mapProduct(rows[0]) : undefined;
      },
      () => staticProducts.find((p) => p.slug === slug),
    ),
  );
}

export async function getSiteSettings(): Promise<SiteSettingsData> {
  if (!isDatabaseConfigured()) {
    return staticSiteSettings();
  }

  return getCached("siteSettings", () =>
    withDbFallback(
      async () => {
        const db = getDb();
        const rows = await db.select().from(siteSettings).limit(1);
        const row = rows[0];
        if (!row) return staticSiteSettings();

        return {
          whatsappNumber: row.whatsappNumber,
          email: row.email,
          instagramUrl: row.instagramUrl,
          instagramHandle: row.instagramHandle,
          founder: row.founder,
          location: row.location,
        };
      },
      staticSiteSettings,
    ),
  );
}

export async function getProductCount(): Promise<number> {
  if (!isDatabaseConfigured()) {
    return staticProducts.length;
  }

  return getCached("productCount", () =>
    withDbFallback(
      async () => {
        const db = getDb();
        const [row] = await db.select({ value: count() }).from(productsTable);
        return Number(row?.value ?? 0);
      },
      () => staticProducts.length,
    ),
  );
}
