import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { isDatabaseConfigured } from "@/db/index.server";
import { buildVisitorWhatsAppMessage, publicEnquirySchema } from "@/lib/enquiries";
import { insertEnquiry, resolveEnquiryContext } from "@/lib/enquiries.server";
import {
  checkEnquiryRateLimit,
  getEnquiryClientIp,
  recordEnquirySubmission,
} from "@/lib/enquiry-rate-limit.server";
import { logError, logInfo } from "@/lib/logger.server";

const GENERIC_ERROR = "We could not save your enquiry. Please try again shortly.";

export const submitEnquiry = createServerFn({ method: "POST" })
  .validator(z.unknown())
  .handler(async ({ data }) => {
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
        // Validation / rate-limit messages already safe
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
  });
