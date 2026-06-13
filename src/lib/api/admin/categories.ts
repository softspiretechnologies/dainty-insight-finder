import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/index.server";
import { categories as categoriesTable } from "@/db/schema";
import { imageUploadPayloadSchema } from "@/lib/admin-upload-payload";
import { getAdminSession } from "@/lib/auth.server";
import { clearDataCache } from "@/lib/data.server";
import { deleteUploadedImage, saveUploadedImageFromPayload } from "@/lib/uploads.server";

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
  existingImagePath: z.string().optional(),
  image: imageUploadPayloadSchema.optional(),
});

export const listAdminCategories = createServerFn({ method: "GET" }).handler(async () => {
  requireAdmin();
  const db = getDb();
  return db.select().from(categoriesTable).orderBy(categoriesTable.sortOrder);
});

export const saveAdminCategory = createServerFn({ method: "POST" })
  .validator(categoryInputSchema)
  .handler(async ({ data }) => {
    requireAdmin();

    let imagePath = data.existingImagePath ?? "";
    if (data.image) {
      imagePath = await saveUploadedImageFromPayload(data.image, "categories");
      if (data.existingImagePath) {
        await deleteUploadedImage(data.existingImagePath);
      }
    }

    if (!imagePath) {
      throw new Error("Category image is required");
    }

    const db = getDb();
    const values = {
      label: data.label,
      blurb: data.blurb,
      imagePath,
      sortOrder: data.sortOrder,
    };

    const existing = await db.select().from(categoriesTable).where(eq(categoriesTable.id, data.id)).limit(1);
    if (existing[0]) {
      await db.update(categoriesTable).set(values).where(eq(categoriesTable.id, data.id));
    } else {
      await db.insert(categoriesTable).values({ id: data.id, ...values });
    }

    clearDataCache();
    return { id: data.id };
  });
