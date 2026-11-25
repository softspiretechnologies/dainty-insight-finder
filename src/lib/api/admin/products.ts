import { createServerFn } from "@tanstack/react-start";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/index.server";
import { categories as categoriesTable, products as productsTable } from "@/db/schema";
import { isValidUploadPath } from "@/lib/admin-upload-path";
import { buildBulkQuickProductInsertRows } from "@/lib/admin-product-bulk";
import {
  bulkProductQuickCreateSchema,
  duplicateProductInputSchema,
  productInputSchema,
} from "@/lib/admin-schemas";
import { stripBulletPrefix } from "@/lib/bullet-lines";
import { requireAdmin } from "@/lib/auth.server";
import { clearDataCache } from "@/lib/data.server";
import {
  assertHomepageFeaturedCount,
  featuredDisabledState,
  wantsHomepageFeature,
} from "@/lib/homepage-featured";
import { allocateUniqueProductSlugs, duplicateProductDisplayName } from "@/lib/product-slug";
import {
  copyUploadedProductImage,
  deleteUploadedImage,
  saveUploadedImageFromPayload,
} from "@/lib/uploads.server";
import type { CategoryId } from "@/types/catalog";

function parseDetails(raw: string) {
  return raw.split("\n").map(stripBulletPrefix).filter(Boolean);
}

function isDuplicateKeyError(error: unknown) {
  return error instanceof Error && /duplicate|unique/i.test(error.message);
}

async function assertHomepageFeaturedLimit(
  db: ReturnType<typeof getDb>,
  featured: boolean,
  excludeId?: number,
) {
  if (!featured) return;

  const rows = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(
      excludeId
        ? and(eq(productsTable.featuredOnHomepage, true), ne(productsTable.id, excludeId))
        : eq(productsTable.featuredOnHomepage, true),
    );

  assertHomepageFeaturedCount(rows.length);
}

export const listAdminProducts = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const db = getDb();
  return db.select().from(productsTable).orderBy(productsTable.name);
});

/** Products list page — products + categories in one authenticated round-trip. */
export const getAdminProductsPageData = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const db = getDb();
  const [products, categories] = await Promise.all([
    db
      .select({
        id: productsTable.id,
        slug: productsTable.slug,
        name: productsTable.name,
        categoryId: productsTable.categoryId,
        imagePath: productsTable.imagePath,
        priceFrom: productsTable.priceFrom,
        isActive: productsTable.isActive,
        featuredOnHomepage: productsTable.featuredOnHomepage,
      })
      .from(productsTable)
      .orderBy(productsTable.name),
    db
      .select({
        id: categoriesTable.id,
        label: categoriesTable.label,
      })
      .from(categoriesTable)
      .orderBy(categoriesTable.sortOrder),
  ]);
  return { products, categories };
});

export const getAdminProduct = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = getDb();
    const rows = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, data.id))
      .limit(1);
    return rows[0] ?? null;
  });

const productEditorIdSchema = z.object({
  productId: z.union([
    z.literal("new"),
    z
      .string()
      .regex(/^\d+$/, "Invalid product id")
      .transform((value) => Number(value))
      .pipe(z.number().int().positive()),
  ]),
});

/**
 * Product editor page — categories + product (or null for create) without sequential
 * requireAdmin/session resolution across two server functions.
 */
export const getAdminProductEditorData = createServerFn({ method: "GET" })
  .validator(productEditorIdSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = getDb();
    const categoriesQuery = db.select().from(categoriesTable).orderBy(categoriesTable.sortOrder);

    if (data.productId === "new") {
      return { product: null, categories: await categoriesQuery };
    }

    const [categories, productRows] = await Promise.all([
      categoriesQuery,
      db.select().from(productsTable).where(eq(productsTable.id, data.productId)).limit(1),
    ]);
    return { product: productRows[0] ?? null, categories };
  });

async function resolveHomepageFeaturedState(
  db: ReturnType<typeof getDb>,
  options: {
    isActive: boolean;
    featuredOnHomepage: boolean;
    excludeId?: number;
    previousFeatured?: boolean;
    previousSortOrder?: number;
  },
) {
  const { isActive, featuredOnHomepage, excludeId, previousFeatured, previousSortOrder } = options;

  if (!wantsHomepageFeature(isActive, featuredOnHomepage)) {
    return featuredDisabledState();
  }

  await assertHomepageFeaturedLimit(db, true, excludeId);

  if (previousFeatured) {
    return { featuredOnHomepage: true, homepageSortOrder: previousSortOrder ?? 0 };
  }

  const featuredRows = await db
    .select({ order: productsTable.homepageSortOrder })
    .from(productsTable)
    .where(eq(productsTable.featuredOnHomepage, true));
  const nextOrder =
    featuredRows.length > 0 ? Math.max(...featuredRows.map((row) => row.order)) + 1 : 0;

  return { featuredOnHomepage: true, homepageSortOrder: nextOrder };
}

export const saveAdminProduct = createServerFn({ method: "POST" })
  .validator(productInputSchema)
  .handler(async ({ data }) => {
    await requireAdmin();

    const id = data.id === "new" ? undefined : data.id;

    let imagePath = "";
    if (data.existingImagePath) {
      if (!isValidUploadPath(data.existingImagePath, "products")) {
        throw new Error("Invalid existing image path");
      }
      imagePath = data.existingImagePath;
    }

    if (data.image) {
      imagePath = await saveUploadedImageFromPayload(data.image, "products");
      if (data.existingImagePath && data.existingImagePath !== imagePath) {
        await deleteUploadedImage(data.existingImagePath);
      }
    }

    if (!imagePath) {
      throw new Error("Product image is required");
    }

    const db = getDb();

    try {
      if (id) {
        const existing = await db
          .select()
          .from(productsTable)
          .where(eq(productsTable.id, id))
          .limit(1);
        if (!existing[0]) throw new Error("Product not found");

        const featuredState = await resolveHomepageFeaturedState(db, {
          isActive: data.isActive,
          featuredOnHomepage: data.featuredOnHomepage,
          excludeId: id,
          previousFeatured: existing[0].featuredOnHomepage,
          previousSortOrder: existing[0].homepageSortOrder,
        });

        const values = {
          slug: data.slug,
          name: data.name,
          categoryId: data.categoryId as CategoryId,
          blurb: data.blurb,
          description: data.description,
          metaTitle: data.metaTitle === undefined ? undefined : data.metaTitle || null,
          metaDescription: data.metaDescription === undefined ? undefined : data.metaDescription || null,
          details: parseDetails(data.details),
          imagePath,
          priceFrom: data.priceFrom?.trim() || null,
          isActive: data.isActive,
          ...featuredState,
        };

        await db.update(productsTable).set(values).where(eq(productsTable.id, id));
        clearDataCache();
        return { id };
      }

      const featuredState = await resolveHomepageFeaturedState(db, {
        isActive: data.isActive,
        featuredOnHomepage: data.featuredOnHomepage,
      });

      const values = {
        slug: data.slug,
        name: data.name,
        categoryId: data.categoryId as CategoryId,
        blurb: data.blurb,
        description: data.description,
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        details: parseDetails(data.details),
        imagePath,
        priceFrom: data.priceFrom?.trim() || null,
        isActive: data.isActive,
        ...featuredState,
      };

      const result = await db.insert(productsTable).values(values);
      const header = Array.isArray(result) ? result[0] : result;
      const insertId = Number((header as { insertId?: number }).insertId);
      clearDataCache();
      if (insertId) return { id: insertId };

      const rows = await db
        .select()
        .from(productsTable)
        .where(eq(productsTable.slug, data.slug))
        .limit(1);
      return { id: rows[0]!.id };
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new Error("A product with this slug already exists. Change the product name.");
      }
      throw error;
    }
  });

export const toggleAdminProductHomepageFeatured = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int().positive(), featured: z.boolean() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = getDb();
    const rows = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, data.id))
      .limit(1);
    const product = rows[0];
    if (!product) throw new Error("Product not found");

    if (data.featured) {
      if (!product.isActive) {
        throw new Error("Activate the product before featuring it on the homepage.");
      }
      await assertHomepageFeaturedLimit(db, true, data.id);
      const featuredRows = await db
        .select({ order: productsTable.homepageSortOrder })
        .from(productsTable)
        .where(eq(productsTable.featuredOnHomepage, true));
      const nextOrder =
        featuredRows.length > 0 ? Math.max(...featuredRows.map((row) => row.order)) + 1 : 0;

      await db
        .update(productsTable)
        .set({ featuredOnHomepage: true, homepageSortOrder: nextOrder })
        .where(eq(productsTable.id, data.id));
    } else {
      await db
        .update(productsTable)
        .set({ featuredOnHomepage: false, homepageSortOrder: 0 })
        .where(eq(productsTable.id, data.id));
    }

    clearDataCache();
    return { featured: data.featured };
  });

export const toggleAdminProductActive = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int().positive(), active: z.boolean() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = getDb();
    const rows = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, data.id))
      .limit(1);
    const product = rows[0];
    if (!product) throw new Error("Product not found");

    if (data.active) {
      await db.update(productsTable).set({ isActive: true }).where(eq(productsTable.id, data.id));
    } else {
      await db
        .update(productsTable)
        .set({ isActive: false, ...featuredDisabledState() })
        .where(eq(productsTable.id, data.id));
    }

    clearDataCache();
    return { active: data.active };
  });

export const deleteAdminProduct = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = getDb();
    const rows = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, data.id))
      .limit(1);
    const product = rows[0];
    if (!product) throw new Error("Product not found");

    await db.delete(productsTable).where(eq(productsTable.id, data.id));
    await deleteUploadedImage(product.imagePath);
    clearDataCache();
    return { ok: true as const };
  });

export const bulkCreateAdminProducts = createServerFn({ method: "POST" })
  .validator(bulkProductQuickCreateSchema)
  .handler(async ({ data }) => {
    await requireAdmin();

    const db = getDb();
    const existing = await db.select({ slug: productsTable.slug }).from(productsTable);
    const rows = buildBulkQuickProductInsertRows(
      data.items,
      existing.map((row) => row.slug),
    );

    const uploadedPaths: string[] = [];
    const createdIds: number[] = [];

    try {
      for (let index = 0; index < data.items.length; index += 1) {
        const item = data.items[index]!;
        const meta = rows[index]!;
        const imagePath = await saveUploadedImageFromPayload(item.image, "products");
        uploadedPaths.push(imagePath);

        const result = await db.insert(productsTable).values({
          ...meta,
          imagePath,
        });
        const header = Array.isArray(result) ? result[0] : result;
        let insertId = Number((header as { insertId?: number }).insertId);
        if (!insertId) {
          const found = await db
            .select({ id: productsTable.id })
            .from(productsTable)
            .where(eq(productsTable.slug, meta.slug))
            .limit(1);
          insertId = found[0]?.id ?? 0;
        }
        if (!insertId) {
          throw new Error("Product could not be created.");
        }
        createdIds.push(insertId);
      }

      clearDataCache();
      return { ids: createdIds, count: createdIds.length };
    } catch (error) {
      for (const id of [...createdIds].reverse()) {
        try {
          const found = await db
            .select({ imagePath: productsTable.imagePath })
            .from(productsTable)
            .where(eq(productsTable.id, id))
            .limit(1);
          await db.delete(productsTable).where(eq(productsTable.id, id));
          await deleteUploadedImage(found[0]?.imagePath);
        } catch {
          // continue cleanup
        }
      }
      for (const orphanPath of uploadedPaths.slice(createdIds.length)) {
        try {
          await deleteUploadedImage(orphanPath);
        } catch {
          // ignore
        }
      }

      if (isDuplicateKeyError(error)) {
        throw new Error(
          "A product with this name already exists. Change a product name and try again.",
        );
      }
      throw error instanceof Error ? error : new Error("Bulk create failed.");
    }
  });

export const duplicateAdminProduct = createServerFn({ method: "POST" })
  .validator(duplicateProductInputSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = getDb();
    const rows = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, data.id))
      .limit(1);
    const source = rows[0];
    if (!source) throw new Error("Product not found");

    const name = duplicateProductDisplayName(source.name);
    const existing = await db.select({ slug: productsTable.slug }).from(productsTable);
    const [slug] = allocateUniqueProductSlugs(
      [name],
      existing.map((row) => row.slug),
    );

    if (!source.imagePath || !isValidUploadPath(source.imagePath, "products")) {
      throw new Error("Source product image is missing or invalid.");
    }

    let imagePath = "";
    try {
      imagePath = await copyUploadedProductImage(source.imagePath);
    } catch {
      throw new Error("Could not copy the product image for the duplicate.");
    }

    try {
      const details = Array.isArray(source.details) ? source.details : [];
      const result = await db.insert(productsTable).values({
        slug: slug!,
        name,
        categoryId: source.categoryId as CategoryId,
        blurb: source.blurb,
        description: source.description,
        details,
        imagePath,
        priceFrom: source.priceFrom,
        isActive: false,
        featuredOnHomepage: false,
        homepageSortOrder: 0,
      });
      const header = Array.isArray(result) ? result[0] : result;
      let insertId = Number((header as { insertId?: number }).insertId);
      if (!insertId) {
        const found = await db
          .select({ id: productsTable.id })
          .from(productsTable)
          .where(eq(productsTable.slug, slug!))
          .limit(1);
        insertId = found[0]?.id ?? 0;
      }
      if (!insertId) {
        await deleteUploadedImage(imagePath);
        throw new Error("Duplicate product could not be created.");
      }
      clearDataCache();
      return { id: insertId };
    } catch (error) {
      await deleteUploadedImage(imagePath);
      if (isDuplicateKeyError(error)) {
        throw new Error("A product with this name already exists. Rename and try again.");
      }
      throw error;
    }
  });
