import { createServerFn } from "@tanstack/react-start";
import { and, count, desc, eq, like, or } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/index.server";
import { enquiries } from "@/db/schema";
import { requireAdmin } from "@/lib/auth.server";
import {
  ENQUIRY_STATUSES,
  adminEnquiryListFilterSchema,
  adminEnquiryNotesSchema,
  adminEnquiryStatusSchema,
  serializeEnquiry,
  type EnquiryStatus,
} from "@/lib/enquiries";
import { logError } from "@/lib/logger.server";

const TABLE_ERROR =
  "Enquiries could not be loaded. The enquiries table may be missing — run npm run db:ensure.";

export const listAdminEnquiries = createServerFn({ method: "GET" })
  .validator(adminEnquiryListFilterSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    try {
      const db = getDb();
      const conditions = [];
      if (data.status !== "all") {
        conditions.push(eq(enquiries.status, data.status));
      }
      if (data.q) {
        const term = `%${data.q.replace(/[%_]/g, "")}%`;
        conditions.push(
          or(
            like(enquiries.name, term),
            like(enquiries.phone, term),
            like(enquiries.productNameSnapshot, term),
            like(enquiries.serviceTitleSnapshot, term),
          ),
        );
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db
        .select()
        .from(enquiries)
        .where(where)
        .orderBy(desc(enquiries.createdAt))
        .limit(200);
      return { enquiries: rows.map(serializeEnquiry) };
    } catch (error) {
      logError("admin.enquiries.list_failed", error);
      return { enquiries: [], error: TABLE_ERROR };
    }
  });

export const getAdminEnquiry = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    try {
      const rows = await getDb().select().from(enquiries).where(eq(enquiries.id, data.id)).limit(1);
      return rows[0] ? serializeEnquiry(rows[0]) : null;
    } catch (error) {
      logError("admin.enquiries.get_failed", error, { id: data.id });
      throw new Error(TABLE_ERROR);
    }
  });

export const updateAdminEnquiryStatus = createServerFn({ method: "POST" })
  .validator(adminEnquiryStatusSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    try {
      await getDb().update(enquiries).set({ status: data.status }).where(eq(enquiries.id, data.id));
      return { ok: true as const };
    } catch (error) {
      logError("admin.enquiries.status_failed", error, { id: data.id });
      throw new Error(TABLE_ERROR);
    }
  });

export const updateAdminEnquiryNotes = createServerFn({ method: "POST" })
  .validator(adminEnquiryNotesSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    try {
      await getDb()
        .update(enquiries)
        .set({ adminNotes: data.adminNotes })
        .where(eq(enquiries.id, data.id));
      return { ok: true as const };
    } catch (error) {
      logError("admin.enquiries.notes_failed", error, { id: data.id });
      throw new Error(TABLE_ERROR);
    }
  });

export const getAdminEnquirySummary = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const empty = {
    new: 0,
    contacted: 0,
    quoted: 0,
    confirmed: 0,
    lost: 0,
    recent: [] as ReturnType<typeof serializeEnquiry>[],
  };
  try {
    const db = getDb();
    const counts = await db
      .select({ status: enquiries.status, value: count() })
      .from(enquiries)
      .groupBy(enquiries.status);
    const summary = { ...empty };
    for (const row of counts) {
      if ((ENQUIRY_STATUSES as readonly string[]).includes(row.status)) {
        summary[row.status as EnquiryStatus] = Number(row.value);
      }
    }
    const recentRows = await db
      .select()
      .from(enquiries)
      .orderBy(desc(enquiries.createdAt))
      .limit(5);
    summary.recent = recentRows.map(serializeEnquiry);
    return summary;
  } catch (error) {
    logError("admin.enquiries.summary_failed", error);
    return empty;
  }
});
