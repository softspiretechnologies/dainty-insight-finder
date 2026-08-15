import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/index.server";
import { categories as categoriesTable } from "@/db/schema";
import { isValidUploadPath } from "@/lib/admin-upload-path";
import { categoryInputSchema } from "@/lib/admin-schemas";
import { planReorderMove, type MoveDirection } from "@/lib/admin-reorder";
import { requireAdmin } from "@/lib/auth.server";
import { clearDataCache } from "@/lib/data.server";
import { deleteUploadedImage, saveUploadedImageFromPayload } from "@/lib/uploads.server";

export const listAdminCategories = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const db = getDb();
  return db.select().from(categoriesTable).orderBy(categoriesTable.sortOrder);
});

export const saveAdminCategory = createServerFn({ method: "POST" })
  .validator(categoryInputSchema)
  .handler(async ({ data }) => {
    await requireAdmin();

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

    const existing = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, data.id))
      .limit(1);
    if (existing[0]) {
      await db.update(categoriesTable).set(values).where(eq(categoriesTable.id, data.id));
    } else {
      await db.insert(categoriesTable).values({ id: data.id, ...values });
    }

    clearDataCache();
    return { id: data.id };
  });

const moveSchema = z.object({
  id: z.string().min(1).max(32),
  direction: z.enum(["up", "down"]),
});

export const moveAdminCategory = createServerFn({ method: "POST" })
  .validator(moveSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = getDb();
    const rows = await db.select().from(categoriesTable).orderBy(categoriesTable.sortOrder);
    const plan = planReorderMove(
      rows.map((row) => ({ id: row.id, sortOrder: row.sortOrder })),
      data.id,
      data.direction as MoveDirection,
    );
    if (!plan) throw new Error("That category cannot be moved further.");

    await db.transaction(async (tx) => {
      for (const item of plan) {
        await tx
          .update(categoriesTable)
          .set({ sortOrder: item.sortOrder })
          .where(eq(categoriesTable.id, item.id));
      }
    });

    clearDataCache();
    return { ok: true as const };
  });
