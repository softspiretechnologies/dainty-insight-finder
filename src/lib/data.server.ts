import { and, asc, count, eq } from "drizzle-orm";

import { getDb, isDatabaseConfigured } from "@/db/index.server";
import { categories as categoriesTable, products as productsTable, services as servicesTable, siteSettings, testimonials as testimonialsTable } from "@/db/schema";
import {
  categories as staticCategories,
  products as staticProducts,
} from "@/data/products";
import { defaultServicesPageContent, seedServices } from "@/data/services-seed";
import { defaultTestimonialsHeading, seedTestimonials } from "@/data/testimonials-seed";
import { getCached } from "@/lib/cache.server";
import { normalizeProductDetails } from "@/lib/product-details";
import { stripBulletPrefix } from "@/lib/bullet-lines";
import { site } from "@/lib/site";
import type {
  CatalogCategory,
  CatalogProduct,
  CatalogService,
  CategoryId,
  HomepageGalleryItem,
  ServicesPageData,
  SiteSettingsData,
  Testimonial,
  TestimonialsSectionData,
} from "@/types/catalog";

export { clearDataCache } from "@/lib/cache.server";

const staticSiteSettings = (): SiteSettingsData => ({
  whatsappNumber: site.whatsappNumber,
  email: site.email,
  instagramUrl: site.instagramUrl,
  instagramHandle: site.instagramHandle,
  founder: site.founder,
  location: site.location,
  servicesIntro: defaultServicesPageContent.intro,
  servicesFooterTitle: defaultServicesPageContent.footerTitle,
  servicesFooterBlurb: defaultServicesPageContent.footerBlurb,
});

function parseBullets(raw: string) {
  return raw
    .split("\n")
    .map(stripBulletPrefix)
    .filter(Boolean);
}

function staticServicesPageData(): ServicesPageData {
  return {
    intro: defaultServicesPageContent.intro,
    footerTitle: defaultServicesPageContent.footerTitle,
    footerBlurb: defaultServicesPageContent.footerBlurb,
    services: seedServices.map((service) => ({
      id: service.id,
      title: service.title,
      blurb: service.blurb,
      bullets: service.bullets,
      image: `/uploads/services/${service.id}.jpg`,
      sortOrder: service.sortOrder,
    })),
  };
}

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
        const rows = await db
          .select()
          .from(productsTable)
          .where(eq(productsTable.isActive, true))
          .orderBy(asc(productsTable.name));
        return rows.map(mapProduct);
      },
      () => staticProducts.map((p) => ({ ...p })),
    ),
  );
}

export async function getFeaturedHomepageProducts(): Promise<HomepageGalleryItem[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  return getCached("featuredHomepageProducts", () =>
    withDbFallback(
      async () => {
        const db = getDb();
        const rows = await db
          .select()
          .from(productsTable)
          .where(and(eq(productsTable.featuredOnHomepage, true), eq(productsTable.isActive, true)))
          .orderBy(asc(productsTable.homepageSortOrder), asc(productsTable.name))
          .limit(6);
        return rows.map((row) => ({
          slug: row.slug,
          name: row.name,
          blurb: row.blurb,
          image: row.imagePath,
        }));
      },
      () => [],
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
        const rows = await db
          .select()
          .from(productsTable)
          .where(and(eq(productsTable.slug, slug), eq(productsTable.isActive, true)))
          .limit(1);
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
          servicesIntro: row.servicesIntro || defaultServicesPageContent.intro,
          servicesFooterTitle: row.servicesFooterTitle || defaultServicesPageContent.footerTitle,
          servicesFooterBlurb: row.servicesFooterBlurb || defaultServicesPageContent.footerBlurb,
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
        const [row] = await db
          .select({ value: count() })
          .from(productsTable)
          .where(eq(productsTable.isActive, true));
        return Number(row?.value ?? 0);
      },
      () => staticProducts.length,
    ),
  );
}

function mapService(row: typeof servicesTable.$inferSelect): CatalogService {
  return {
    id: row.id as CatalogService["id"],
    title: row.title,
    blurb: row.blurb,
    bullets: normalizeProductDetails(row.bullets),
    image: row.imagePath,
    sortOrder: row.sortOrder,
  };
}

export async function getServicesPageData(): Promise<ServicesPageData> {
  if (!isDatabaseConfigured()) {
    return staticServicesPageData();
  }

  return getCached("servicesPage", () =>
    withDbFallback(
      async () => {
        const db = getDb();
        const [settingsRows, serviceRows] = await Promise.all([
          db.select().from(siteSettings).limit(1),
          db.select().from(servicesTable).orderBy(asc(servicesTable.sortOrder)),
        ]);

        const settings = settingsRows[0];
        const services = serviceRows.length > 0 ? serviceRows.map(mapService) : staticServicesPageData().services;

        return {
          intro: settings?.servicesIntro || defaultServicesPageContent.intro,
          footerTitle: settings?.servicesFooterTitle || defaultServicesPageContent.footerTitle,
          footerBlurb: settings?.servicesFooterBlurb || defaultServicesPageContent.footerBlurb,
          services,
        };
      },
      staticServicesPageData,
    ),
  );
}

function mapTestimonial(row: typeof testimonialsTable.$inferSelect): Testimonial {
  return {
    id: row.id,
    quote: row.quote,
    customerName: row.customerName,
    location: row.location,
    context: row.context,
    sortOrder: row.sortOrder,
  };
}

function staticTestimonialsSection(): TestimonialsSectionData {
  return {
    heading: defaultTestimonialsHeading,
    items: seedTestimonials.map((item, index) => ({
      id: index + 1,
      quote: item.quote,
      customerName: item.customerName,
      location: item.location,
      context: item.context,
      sortOrder: item.sortOrder,
    })),
  };
}

export async function getTestimonialsSection(): Promise<TestimonialsSectionData> {
  if (!isDatabaseConfigured()) {
    return staticTestimonialsSection();
  }

  return getCached("testimonialsSection", () =>
    withDbFallback(
      async () => {
        const db = getDb();
        const [settingsRows, rows] = await Promise.all([
          db.select().from(siteSettings).limit(1),
          db.select().from(testimonialsTable).orderBy(asc(testimonialsTable.sortOrder)),
        ]);

        const settings = settingsRows[0];
        const items = rows.length > 0 ? rows.map(mapTestimonial) : staticTestimonialsSection().items;

        return {
          heading: settings?.testimonialsHeading || defaultTestimonialsHeading,
          items,
        };
      },
      staticTestimonialsSection,
    ),
  );
}
