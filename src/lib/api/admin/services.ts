import { createServerFn } from "@tanstack/react-start";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/index.server";
import { services as servicesTable, siteSettings } from "@/db/schema";
import { defaultServicesPageContent, seedServices } from "@/data/services-seed";
import { isValidUploadPath } from "@/lib/admin-upload-path";
import { serviceInputSchema, servicesPageInputSchema } from "@/lib/admin-schemas";
import { planReorderMove } from "@/lib/admin-reorder";
import { stripBulletPrefix } from "@/lib/bullet-lines";
import { requireAdmin } from "@/lib/auth.server";
import { clearDataCache } from "@/lib/data.server";
import { deleteUploadedImage, saveUploadedImageFromPayload } from "@/lib/uploads.server";

function parseBullets(raw: string) {
  return raw.split("\n").map(stripBulletPrefix).filter(Boolean);
}

export const listAdminServicesData = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const db = getDb();
  const [serviceRows, settingsRows] = await Promise.all([
    db.select().from(servicesTable).orderBy(asc(servicesTable.sortOrder)),
    db.select().from(siteSettings).limit(1),
  ]);

  const services =
    serviceRows.length > 0
      ? serviceRows
      : seedServices.map((service) => ({
          id: service.id,
          title: service.title,
          blurb: service.blurb,
          bullets: service.bullets,
          imagePath: `/uploads/services/${service.id}.jpg`,
          sortOrder: service.sortOrder,
        }));

  const settings = settingsRows[0];

  return {
    services,
    page: {
      intro: settings?.servicesIntro || defaultServicesPageContent.intro,
      footerTitle: settings?.servicesFooterTitle || defaultServicesPageContent.footerTitle,
      footerBlurb: settings?.servicesFooterBlurb || defaultServicesPageContent.footerBlurb,
    },
  };
});

export const saveAdminService = createServerFn({ method: "POST" })
  .validator(serviceInputSchema)
  .handler(async ({ data }) => {
    await requireAdmin();

    let imagePath = "";
    if (data.existingImagePath) {
      if (!isValidUploadPath(data.existingImagePath, "services")) {
        throw new Error("Invalid existing image path");
      }
      imagePath = data.existingImagePath;
    }

    if (data.image) {
      imagePath = await saveUploadedImageFromPayload(data.image, "services");
      if (data.existingImagePath && data.existingImagePath !== imagePath) {
        await deleteUploadedImage(data.existingImagePath);
      }
    }

    if (!imagePath) {
      throw new Error("Service image is required");
    }

    const bullets = parseBullets(data.bullets);
    if (bullets.length === 0) {
      throw new Error("Add at least one bullet point");
    }

    const db = getDb();
    const values = {
      title: data.title.trim(),
      blurb: data.blurb.trim(),
      bullets,
      imagePath,
      sortOrder: data.sortOrder,
    };

    const existing = await db
      .select()
      .from(servicesTable)
      .where(eq(servicesTable.id, data.id))
      .limit(1);
    if (existing[0]) {
      await db.update(servicesTable).set(values).where(eq(servicesTable.id, data.id));
    } else {
      await db.insert(servicesTable).values({ id: data.id, ...values });
    }

    clearDataCache();
    return { id: data.id };
  });

export const saveAdminServicesPage = createServerFn({ method: "POST" })
  .validator(servicesPageInputSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = getDb();
    const rows = await db.select().from(siteSettings).limit(1);

    const values = {
      servicesIntro: data.intro.trim(),
      servicesFooterTitle: data.footerTitle.trim(),
      servicesFooterBlurb: data.footerBlurb.trim(),
    };

    if (rows[0]) {
      await db.update(siteSettings).set(values).where(eq(siteSettings.id, rows[0].id));
    } else {
      await db.insert(siteSettings).values({
        id: 1,
        whatsappNumber: "",
        email: "",
        instagramUrl: "",
        instagramHandle: "",
        founder: "",
        location: "",
        ...values,
      });
    }

    clearDataCache();
    return { ok: true as const };
  });

const moveServiceSchema = z.object({
  id: z.string().min(1).max(64),
  direction: z.enum(["up", "down"]),
});

export const moveAdminService = createServerFn({ method: "POST" })
  .validator(moveServiceSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = getDb();
    const rows = await db.select().from(servicesTable).orderBy(asc(servicesTable.sortOrder));
    const plan = planReorderMove(
      rows.map((row) => ({ id: row.id, sortOrder: row.sortOrder })),
      data.id,
      data.direction,
    );
    if (!plan) throw new Error("That service cannot be moved further.");

    await db.transaction(async (tx) => {
      for (const item of plan) {
        await tx
          .update(servicesTable)
          .set({ sortOrder: item.sortOrder })
          .where(eq(servicesTable.id, item.id));
      }
    });

    clearDataCache();
    return { ok: true as const };
  });
