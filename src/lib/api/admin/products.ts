import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/index.server";
import { products as productsTable } from "@/db/schema";
import { getAdminSession } from "@/lib/auth.server";
import { deleteUploadedImage, saveUploadedImage } from "@/lib/uploads.server";
import type { CategoryId } from "@/types/catalog";

const categoryIds = [
  "hampers",
  "bouquets",
  "invitations",
  "engagement",
  "frames",
  "albums",
  "calligraphy",
  "celebrations",
] as const;

function requireAdmin() {
  const session = getAdminSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

function parseDetails(raw: string) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

const productInputSchema = z.object({
  slug: z.string().min(1).max(128),
  name: z.string().min(1).max(256),
  categoryId: z.enum(categoryIds),
  blurb: z.string().min(1),
  description: z.string().min(1),
  details: z.string().min(1),
  priceFrom: z.string().optional(),
});

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

const formDataSchema = z.custom<FormData>((value) => value instanceof FormData, {
  message: "Expected FormData",
});

export const saveAdminProduct = createServerFn({ method: "POST" })
  .validator(formDataSchema)
  .handler(async ({ data: formData }) => {
  requireAdmin();

  const idRaw = formData.get("id");
  const id = idRaw && idRaw !== "new" ? Number(idRaw) : undefined;

  const parsed = productInputSchema.parse({
    slug: String(formData.get("slug") ?? ""),
    name: String(formData.get("name") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    blurb: String(formData.get("blurb") ?? ""),
    description: String(formData.get("description") ?? ""),
    details: String(formData.get("details") ?? ""),
    priceFrom: String(formData.get("priceFrom") ?? "") || undefined,
  });

  const file = formData.get("image");
  const existingImagePath = String(formData.get("existingImagePath") ?? "") || undefined;

  let imagePath = existingImagePath ?? "";
  if (file instanceof File && file.size > 0) {
    imagePath = await saveUploadedImage(file, "products");
    if (existingImagePath) {
      await deleteUploadedImage(existingImagePath);
    }
  }

  if (!imagePath) {
    throw new Error("Product image is required");
  }

  const db = getDb();
  const values = {
    slug: parsed.slug,
    name: parsed.name,
    categoryId: parsed.categoryId as CategoryId,
    blurb: parsed.blurb,
    description: parsed.description,
    details: parseDetails(parsed.details),
    imagePath,
    priceFrom: parsed.priceFrom ?? null,
  };

  if (id) {
    const existing = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
    if (!existing[0]) throw new Error("Product not found");
    await db.update(productsTable).set(values).where(eq(productsTable.id, id));
    return { id };
  }

  const result = await db.insert(productsTable).values(values);
  const insertId = Number((result as { insertId?: number }[])[0]?.insertId);
  if (insertId) return { id: insertId };

  const rows = await db.select().from(productsTable).where(eq(productsTable.slug, parsed.slug)).limit(1);
  return { id: rows[0]!.id };
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
    return { ok: true as const };
  });
