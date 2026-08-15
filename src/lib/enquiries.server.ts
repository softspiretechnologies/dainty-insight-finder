import { eq } from "drizzle-orm";

import { getDb, isDatabaseConfigured } from "@/db/index.server";
import { enquiries, products, services } from "@/db/schema";
import {
  buildVisitorWhatsAppMessage,
  normalizeEnquiryPhone,
  publicEnquirySchema,
  type PublicEnquiryInput,
} from "@/lib/enquiries";
import {
  checkEnquiryRateLimit,
  getEnquiryClientIp,
  recordEnquirySubmission,
} from "@/lib/enquiry-rate-limit.server";
import { logError, logInfo } from "@/lib/logger.server";

const GENERIC_ERROR = "We could not save your enquiry. Please try again shortly.";

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

/** Best-effort Admin push after a successful insert. Never throws. */
export async function notifyAfterEnquiryInserted(enquiryId: number): Promise<void> {
  try {
    const { notifyAdminsOfNewEnquiry } = await import("@/lib/admin-push.server");
    await notifyAdminsOfNewEnquiry(enquiryId);
  } catch (error) {
    logError("admin_push.send_failed", error, {
      notificationType: "new_enquiry",
      enquiryId,
    });
  }
}

/** Public enquiry submit core — server-only (used by createServerFn + unit tests). */
export async function submitEnquiryCore(data: unknown) {
  if (!isDatabaseConfigured()) {
    throw new Error("Enquiries are temporarily unavailable. Please try WhatsApp instead.");
  }

  const parsed = publicEnquirySchema.safeParse(data);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Please check the form and try again.";
    throw new Error(first);
  }

  // Honeypot: pretend success without storing.
  if (parsed.data.website && parsed.data.website.trim().length > 0) {
    return {
      id: 0,
      whatsappMessage: buildVisitorWhatsAppMessage({
        name: parsed.data.name,
        message: parsed.data.message,
      }),
    };
  }

  const ip = getEnquiryClientIp();
  const limited = await checkEnquiryRateLimit(ip);
  if (limited) throw new Error(limited);

  try {
    await recordEnquirySubmission(ip);
    const context = await resolveEnquiryContext(parsed.data);
    const { id } = await insertEnquiry(parsed.data, context);
    logInfo("enquiry.submitted", { id, source: parsed.data.source });

    // Enquiry is already stored. Push is best-effort and must never fail the customer.
    try {
      await notifyAfterEnquiryInserted(id);
    } catch (error) {
      logError("admin_push.send_failed", error, {
        notificationType: "new_enquiry",
        enquiryId: id,
      });
    }

    return {
      id,
      whatsappMessage: buildVisitorWhatsAppMessage({
        name: parsed.data.name,
        eventType: parsed.data.eventType,
        eventDate: parsed.data.eventDate,
        budget: parsed.data.budget,
        productName: context.productNameSnapshot ?? undefined,
        serviceTitle: context.serviceTitleSnapshot ?? undefined,
        message: parsed.data.message,
      }),
    };
  } catch (error) {
    if (error instanceof Error && error.message !== GENERIC_ERROR) {
      if (
        /too many enquiries|check the form|valid|tell us|enter your|temporarily unavailable/i.test(
          error.message,
        )
      ) {
        throw error;
      }
    }
    logError("enquiry.submit_failed", error, { source: parsed.data.source });
    throw new Error(GENERIC_ERROR);
  }
}
