import { eq } from "drizzle-orm";

import { getDb, isDatabaseConfigured } from "@/db/index.server";
import { enquiries, products, services } from "@/db/schema";
import {
  normalizeEnquiryPhone,
  publicEnquirySchema,
  type PublicEnquiryInput,
} from "@/lib/enquiries";
import { logError } from "@/lib/logger.server";

export type ResolvedEnquiryContext = {
  productId: number | null;
  productNameSnapshot: string | null;
  serviceId: string | null;
  serviceTitleSnapshot: string | null;
};

/**
 * Resolve product/service labels server-side. Never trust browser-provided names.
 */
export async function resolveEnquiryContext(
  input: Pick<PublicEnquiryInput, "productId" | "productSlug" | "serviceId" | "source">,
): Promise<ResolvedEnquiryContext> {
  const result: ResolvedEnquiryContext = {
    productId: null,
    productNameSnapshot: null,
    serviceId: null,
    serviceTitleSnapshot: null,
  };

  if (!isDatabaseConfigured()) return result;

  const db = getDb();

  if (input.productId || input.productSlug) {
    const rows = input.productId
      ? await db.select().from(products).where(eq(products.id, input.productId)).limit(1)
      : await db.select().from(products).where(eq(products.slug, input.productSlug!)).limit(1);
    const product = rows[0];
    if (product && product.isActive) {
      result.productId = product.id;
      result.productNameSnapshot = product.name;
    }
  }

  if (input.serviceId) {
    const rows = await db.select().from(services).where(eq(services.id, input.serviceId)).limit(1);
    const service = rows[0];
    if (service) {
      result.serviceId = service.id;
      result.serviceTitleSnapshot = service.title;
    }
  }

  return result;
}

export function parsePublicEnquiryPayload(raw: unknown) {
  return publicEnquirySchema.safeParse(raw);
}

export async function insertEnquiry(
  input: PublicEnquiryInput,
  context: ResolvedEnquiryContext,
): Promise<{ id: number }> {
  const db = getDb();
  const values = {
    name: input.name,
    phone: normalizeEnquiryPhone(input.phone),
    email: input.email ?? null,
    eventType: input.eventType ?? null,
    eventDate: input.eventDate ?? null,
    budget: input.budget ?? null,
    message: input.message,
    source: input.source,
    productId: context.productId,
    productNameSnapshot: context.productNameSnapshot,
    serviceId: context.serviceId,
    serviceTitleSnapshot: context.serviceTitleSnapshot,
    status: "new" as const,
    adminNotes: null,
  };

  try {
    const result = await db.insert(enquiries).values(values);
    const header = Array.isArray(result) ? result[0] : result;
    return { id: Number((header as { insertId?: number }).insertId) };
  } catch (error) {
    logError("enquiry.insert_failed", error, { source: input.source });
    throw new Error("We could not save your enquiry. Please try again shortly.");
  }
}
