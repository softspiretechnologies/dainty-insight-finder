import { count, desc, eq } from "drizzle-orm";

import { getDb } from "@/db/index.server";
import { enquiries, products as productsTable } from "@/db/schema";
import { ENQUIRY_STATUSES, serializeEnquiry, type EnquiryStatus } from "@/lib/enquiries";
import { logError } from "@/lib/logger.server";

export type EnquiryStatusCounts = {
  all: number;
  new: number;
  contacted: number;
  quoted: number;
  confirmed: number;
  lost: number;
};

export type EnquirySummary = EnquiryStatusCounts & {
  recent: ReturnType<typeof serializeEnquiry>[];
};

export function emptyEnquiryStatusCounts(): EnquiryStatusCounts {
  return {
    all: 0,
    new: 0,
    contacted: 0,
    quoted: 0,
    confirmed: 0,
    lost: 0,
  };
}

export function emptyEnquirySummary(): EnquirySummary {
  return { ...emptyEnquiryStatusCounts(), recent: [] };
}

type Db = ReturnType<typeof getDb>;

/** Single COUNT for Admin shell badge — not the full status breakdown. */
export async function queryNewEnquiryCount(db: Db = getDb()): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(enquiries)
    .where(eq(enquiries.status, "new"));
  return Number(row?.value ?? 0);
}

export async function queryEnquiryStatusCounts(db: Db = getDb()): Promise<EnquiryStatusCounts> {
  const counts = await db
    .select({ status: enquiries.status, value: count() })
    .from(enquiries)
    .groupBy(enquiries.status);
  const summary = emptyEnquiryStatusCounts();
  for (const row of counts) {
    if ((ENQUIRY_STATUSES as readonly string[]).includes(row.status)) {
      summary[row.status as EnquiryStatus] = Number(row.value);
    }
  }
  summary.all = summary.new + summary.contacted + summary.quoted + summary.confirmed + summary.lost;
  return summary;
}

export async function queryEnquirySummary(db: Db = getDb()): Promise<EnquirySummary> {
  const statusCounts = await queryEnquiryStatusCounts(db);
  const recentRows = await db.select().from(enquiries).orderBy(desc(enquiries.createdAt)).limit(5);
  return {
    ...statusCounts,
    recent: recentRows.map(serializeEnquiry),
  };
}

export async function queryAdminProductCount(db: Db = getDb()): Promise<number> {
  const [row] = await db.select({ value: count() }).from(productsTable);
  return Number(row?.value ?? 0);
}

export async function safeNewEnquiryCount(): Promise<number> {
  try {
    return await queryNewEnquiryCount();
  } catch (error) {
    logError("admin.enquiries.new_count_failed", error);
    return 0;
  }
}

export async function safeEnquirySummary(): Promise<EnquirySummary> {
  try {
    return await queryEnquirySummary();
  } catch (error) {
    logError("admin.enquiries.summary_failed", error);
    return emptyEnquirySummary();
  }
}

export async function safeEnquiryStatusCounts(): Promise<EnquiryStatusCounts> {
  try {
    return await queryEnquiryStatusCounts();
  } catch (error) {
    logError("admin.enquiries.counts_failed", error);
    return emptyEnquiryStatusCounts();
  }
}
