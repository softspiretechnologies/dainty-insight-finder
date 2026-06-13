import { createServerFn } from "@tanstack/react-start";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/index.server";
import { siteSettings, testimonials as testimonialsTable } from "@/db/schema";
import { defaultTestimonialsHeading } from "@/data/testimonials-seed";
import { testimonialInputSchema, testimonialsSectionInputSchema } from "@/lib/admin-schemas";
import { getAdminSession } from "@/lib/auth.server";
import { clearDataCache } from "@/lib/data.server";

function requireAdmin() {
  const session = getAdminSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export const listAdminTestimonialsData = createServerFn({ method: "GET" }).handler(async () => {
  requireAdmin();
  const db = getDb();
  const [rows, settingsRows] = await Promise.all([
    db.select().from(testimonialsTable).orderBy(asc(testimonialsTable.sortOrder)),
    db.select().from(siteSettings).limit(1),
  ]);

  const settings = settingsRows[0];

  return {
    heading: settings?.testimonialsHeading || defaultTestimonialsHeading,
    testimonials: rows,
  };
});

export const saveAdminTestimonial = createServerFn({ method: "POST" })
  .validator(testimonialInputSchema)
  .handler(async ({ data }) => {
    requireAdmin();
    const db = getDb();
    const values = {
      quote: data.quote.trim(),
      customerName: data.customerName.trim(),
      location: data.location.trim(),
      context: data.context.trim(),
      sortOrder: data.sortOrder,
    };

    if (data.id === "new") {
      const result = await db.insert(testimonialsTable).values(values);
      const header = Array.isArray(result) ? result[0] : result;
      const insertId = Number((header as { insertId?: number }).insertId);
      clearDataCache();
      return { id: insertId };
    }

    const existing = await db.select().from(testimonialsTable).where(eq(testimonialsTable.id, data.id)).limit(1);
    if (!existing[0]) throw new Error("Testimonial not found");

    await db.update(testimonialsTable).set(values).where(eq(testimonialsTable.id, data.id));
    clearDataCache();
    return { id: data.id };
  });

export const deleteAdminTestimonial = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    requireAdmin();
    const db = getDb();
    await db.delete(testimonialsTable).where(eq(testimonialsTable.id, data.id));
    clearDataCache();
    return { ok: true as const };
  });

export const saveAdminTestimonialsSection = createServerFn({ method: "POST" })
  .validator(testimonialsSectionInputSchema)
  .handler(async ({ data }) => {
    requireAdmin();
    const db = getDb();
    const rows = await db.select().from(siteSettings).limit(1);
    const values = { testimonialsHeading: data.heading.trim() };

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
        servicesIntro: "",
        servicesFooterTitle: "",
        servicesFooterBlurb: "",
        testimonialsHeading: defaultTestimonialsHeading,
        ...values,
      });
    }

    clearDataCache();
    return { ok: true as const };
  });
