import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, like, or } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/index.server";
import { enquiries } from "@/db/schema";
import {
  emptyEnquiryStatusCounts,
  emptyEnquirySummary,
  queryAdminProductCount,
  queryEnquirySummary,
  safeEnquiryStatusCounts,
  safeEnquirySummary,
  safeNewEnquiryCount,
} from "@/lib/admin-enquiry-queries.server";
import { requireAdmin } from "@/lib/auth.server";
import {
  adminEnquiryListFilterSchema,
  adminEnquiryNotesSchema,
  adminEnquiryStatusSchema,
  adminEnquiryUpdateSchema,
  serializeEnquiry,
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

/** Cheap badge count for AdminShell — one COUNT, no recent rows. */
export const getAdminNewEnquiryCount = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return { count: await safeNewEnquiryCount() };
});

/** Admin chrome: signed-in user + new-enquiry badge. One requireAdmin, no full summary. */
export const getAdminShellData = createServerFn({ method: "GET" }).handler(async () => {
  const session = await requireAdmin();
  return {
    user: { userId: session.userId, name: session.name, email: session.email },
    newEnquiryCount: await safeNewEnquiryCount(),
  };
});

/**
 * Dashboard page data: product count + full enquiry summary in one auth check.
 * Does not replace the shell badge endpoint.
 */
export const getAdminDashboardPageData = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const db = getDb();
  const [productCount, enquirySummary] = await Promise.all([
    queryAdminProductCount(db).catch((error) => {
      logError("admin.dashboard.product_count_failed", error);
      return 0;
    }),
    safeEnquirySummary(),
  ]);
  return { productCount, enquiries: enquirySummary };
});

/** Enquiries list page: filtered list + status counts (no recent rows). */
export const getAdminEnquiriesPageData = createServerFn({ method: "GET" })
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
      const [rows, counts] = await Promise.all([
        db
          .select({
            id: enquiries.id,
            name: enquiries.name,
            phone: enquiries.phone,
            eventDate: enquiries.eventDate,
            source: enquiries.source,
            productNameSnapshot: enquiries.productNameSnapshot,
            serviceTitleSnapshot: enquiries.serviceTitleSnapshot,
            status: enquiries.status,
            createdAt: enquiries.createdAt,
          })
          .from(enquiries)
          .where(where)
          .orderBy(desc(enquiries.createdAt))
          .limit(200),
        safeEnquiryStatusCounts(),
      ]);
      return {
        enquiries: rows.map((row) => ({
          id: row.id,
          name: row.name,
          phone: row.phone,
          eventDate: row.eventDate,
          source: row.source,
          productNameSnapshot: row.productNameSnapshot,
          serviceTitleSnapshot: row.serviceTitleSnapshot,
          status: row.status,
          createdAt: row.createdAt.toISOString(),
        })),
        counts,
      };
    } catch (error) {
      logError("admin.enquiries.page_failed", error);
      return {
        enquiries: [],
        counts: emptyEnquiryStatusCounts(),
        error: TABLE_ERROR,
      };
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

export const updateAdminEnquiry = createServerFn({ method: "POST" })
  .validator(adminEnquiryUpdateSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    try {
      await getDb()
        .update(enquiries)
        .set({ status: data.status, adminNotes: data.adminNotes })
        .where(eq(enquiries.id, data.id));
      return { ok: true as const };
    } catch (error) {
      logError("admin.enquiries.update_failed", error, { id: data.id });
      throw new Error(TABLE_ERROR);
    }
  });

/** Full status breakdown + recent rows (kept for callers that need recent). */
export const getAdminEnquirySummary = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  try {
    return await queryEnquirySummary();
  } catch (error) {
    logError("admin.enquiries.summary_failed", error);
    return emptyEnquirySummary();
  }
});
