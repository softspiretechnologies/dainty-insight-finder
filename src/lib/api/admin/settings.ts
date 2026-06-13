import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";

import { getDb } from "@/db/index.server";
import { siteSettings } from "@/db/schema";
import { settingsSchema } from "@/lib/admin-schemas";
import { getAdminSession } from "@/lib/auth.server";
import { clearDataCache } from "@/lib/data.server";

function requireAdmin() {
  const session = getAdminSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export const getAdminSettings = createServerFn({ method: "GET" }).handler(async () => {
  requireAdmin();
  const db = getDb();
  const rows = await db.select().from(siteSettings).limit(1);
  return rows[0] ?? null;
});

export const saveAdminSettings = createServerFn({ method: "POST" })
  .validator(settingsSchema)
  .handler(async ({ data }) => {
    requireAdmin();
    const db = getDb();
    const rows = await db.select().from(siteSettings).limit(1);

    const values = {
      whatsappNumber: data.whatsappNumber.replace(/\D/g, ""),
      email: data.email.trim().toLowerCase(),
      instagramUrl: data.instagramUrl.trim(),
      instagramHandle: data.instagramHandle.trim(),
      founder: data.founder.trim(),
      location: data.location.trim(),
    };

    if (rows[0]) {
      await db.update(siteSettings).set(values).where(eq(siteSettings.id, rows[0].id));
    } else {
      await db.insert(siteSettings).values({ id: 1, ...values });
    }

    clearDataCache();
    return { ok: true as const };
  });
