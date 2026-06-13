import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/index.server";
import { products as productsTable } from "@/db/schema";
import { isValidUploadPath } from "@/lib/admin-upload-path";
import { productInputSchema } from "@/lib/admin-schemas";
import { stripBulletPrefix } from "@/lib/bullet-lines";
import { getAdminSession } from "@/lib/auth.server";
import { clearDataCache } from "@/lib/data.server";
import { deleteUploadedImage, saveUploadedImageFromPayload } from "@/lib/uploads.server";
import type { CategoryId } from "@/types/catalog";

function requireAdmin() {
  const session = getAdminSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

function parseDetails(raw: string) {
  return raw
    .split("\n")
    .map(stripBulletPrefix)
    .filter(Boolean);
}

function isDuplicateKeyError(error: unknown) {
  return error instanceof Error && /duplicate|unique/i.test(error.message);
}

export const listAdminProducts = createServerFn({ method: "GET" }).handler(async () => {
  requireAdmin();
  const db = getDb();
  return db.select().from(productsTable).orderBy(productsTable.name);
});

export const getAdminProduct = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    requireAdmin();
    const db = getDb();
    const rows = await db.select().from(productsTable).where(eq(productsTable.id, data.id)).limit(1);
    return rows[0] ?? null;
  });

export const saveAdminProduct = createServerFn({ method: "POST" })
  .validator(productInputSchema)
  .handler(async ({ data }) => {
    requireAdmin();

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
    const values = {
      slug: data.slug,
      name: data.name,
      categoryId: data.categoryId as CategoryId,
      blurb: data.blurb,
      description: data.description,
      details: parseDetails(data.details),
      imagePath,
      priceFrom: data.priceFrom?.trim() || null,
    };

    try {
      if (id) {
        const existing = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
        if (!existing[0]) throw new Error("Product not found");
        await db.update(productsTable).set(values).where(eq(productsTable.id, id));
        clearDataCache();
        return { id };
      }

      const result = await db.insert(productsTable).values(values);
      const header = Array.isArray(result) ? result[0] : result;
      const insertId = Number((header as { insertId?: number }).insertId);
      clearDataCache();
      if (insertId) return { id: insertId };

      const rows = await db.select().from(productsTable).where(eq(productsTable.slug, data.slug)).limit(1);
      return { id: rows[0]!.id };
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new Error("A product with this slug already exists. Change the product name.");
      }
      throw error;
    }
  });

export const deleteAdminProduct = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    requireAdmin();
    const db = getDb();
    const rows = await db.select().from(productsTable).where(eq(productsTable.id, data.id)).limit(1);
    const product = rows[0];
    if (!product) throw new Error("Product not found");

    await db.delete(productsTable).where(eq(productsTable.id, data.id));
    await deleteUploadedImage(product.imagePath);
    clearDataCache();
    return { ok: true as const };
  });
