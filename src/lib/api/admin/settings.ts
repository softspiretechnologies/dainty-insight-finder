import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/index.server";
import { siteSettings } from "@/db/schema";
import { getAdminSession } from "@/lib/auth.server";
import { clearDataCache } from "@/lib/data.server";

function requireAdmin() {
  const session = getAdminSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

const settingsSchema = z.object({
  whatsappNumber: z.string().min(8).max(32),
  email: z.string().email(),
  instagramUrl: z.string().url(),
  instagramHandle: z.string().min(1).max(64),
  founder: z.string().min(1).max(128),
  location: z.string().min(1).max(256),
});

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

    if (rows[0]) {
      await db.update(siteSettings).set(data).where(eq(siteSettings.id, rows[0].id));
    } else {
      await db.insert(siteSettings).values({ id: 1, ...data });
    }

    clearDataCache();
    return { ok: true as const };
  });
