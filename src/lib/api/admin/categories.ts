import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";

import { getDb } from "@/db/index.server";
import { categories as categoriesTable } from "@/db/schema";
import { isValidUploadPath } from "@/lib/admin-upload-path";
import { categoryInputSchema } from "@/lib/admin-schemas";
import { getAdminSession } from "@/lib/auth.server";
import { clearDataCache } from "@/lib/data.server";
import { deleteUploadedImage, saveUploadedImageFromPayload } from "@/lib/uploads.server";

function requireAdmin() {
  const session = getAdminSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export const listAdminCategories = createServerFn({ method: "GET" }).handler(async () => {
  requireAdmin();
  const db = getDb();
  return db.select().from(categoriesTable).orderBy(categoriesTable.sortOrder);
});

export const saveAdminCategory = createServerFn({ method: "POST" })
  .validator(categoryInputSchema)
  .handler(async ({ data }) => {
    requireAdmin();

    let imagePath = "";
    if (data.existingImagePath) {
      if (!isValidUploadPath(data.existingImagePath, "categories")) {
        throw new Error("Invalid existing image path");
      }
      imagePath = data.existingImagePath;
    }

    if (data.image) {
      imagePath = await saveUploadedImageFromPayload(data.image, "categories");
      if (data.existingImagePath && data.existingImagePath !== imagePath) {
        await deleteUploadedImage(data.existingImagePath);
      }
    }

    if (!imagePath) {
      throw new Error("Category image is required");
    }

    const db = getDb();
    const values = {
      label: data.label.trim(),
      blurb: data.blurb.trim(),
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
