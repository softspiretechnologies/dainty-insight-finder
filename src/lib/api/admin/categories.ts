import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/index.server";
import { categories as categoriesTable } from "@/db/schema";
import { getAdminSession } from "@/lib/auth.server";
import { deleteUploadedImage, saveUploadedImage } from "@/lib/uploads.server";

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

const categoryInputSchema = z.object({
  id: z.enum(categoryIds),
  label: z.string().min(1).max(128),
  blurb: z.string().min(1),
  sortOrder: z.coerce.number().int().min(0),
});

export const listAdminCategories = createServerFn({ method: "GET" }).handler(async () => {
  requireAdmin();
  const db = getDb();
  return db.select().from(categoriesTable).orderBy(categoriesTable.sortOrder);
});

const formDataSchema = z.custom<FormData>((value) => value instanceof FormData, {
  message: "Expected FormData",
});

export const saveAdminCategory = createServerFn({ method: "POST" })
  .validator(formDataSchema)
  .handler(async ({ data: formData }) => {
  requireAdmin();

  const parsed = categoryInputSchema.parse({
    id: String(formData.get("id") ?? ""),
    label: String(formData.get("label") ?? ""),
    blurb: String(formData.get("blurb") ?? ""),
    sortOrder: formData.get("sortOrder") ?? 0,
  });

  const file = formData.get("image");
  const existingImagePath = String(formData.get("existingImagePath") ?? "") || undefined;

  let imagePath = existingImagePath ?? "";
  if (file instanceof File && file.size > 0) {
    imagePath = await saveUploadedImage(file, "categories");
    if (existingImagePath) {
      await deleteUploadedImage(existingImagePath);
    }
  }

  if (!imagePath) {
    throw new Error("Category image is required");
  }

  const db = getDb();
  const values = {
    label: parsed.label,
    blurb: parsed.blurb,
    imagePath,
    sortOrder: parsed.sortOrder,
  };

  const existing = await db.select().from(categoriesTable).where(eq(categoriesTable.id, parsed.id)).limit(1);
  if (existing[0]) {
    await db.update(categoriesTable).set(values).where(eq(categoriesTable.id, parsed.id));
  } else {
    await db.insert(categoriesTable).values({ id: parsed.id, ...values });
  }

  return { id: parsed.id };
});
