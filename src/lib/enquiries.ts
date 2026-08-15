import { z } from "zod";

export const ENQUIRY_STATUSES = ["new", "contacted", "quoted", "confirmed", "lost"] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const ENQUIRY_SOURCES = ["general", "product", "service", "contact"] as const;
export type EnquirySource = (typeof ENQUIRY_SOURCES)[number];

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  confirmed: "Confirmed",
  lost: "Lost",
};

export const EVENT_TYPE_OPTIONS = [
  "Wedding",
  "Engagement / Nikah",
  "Birthday",
  "Anniversary",
  "Corporate",
  "Other",
] as const;

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined));

export function digitsOnlyPhone(value: string) {
  return value.replace(/\D/g, "");
}

/** Normalize common Indian WhatsApp numbers to digits (prefer 91XXXXXXXXXX when 10-digit local). */
export function normalizeEnquiryPhone(raw: string) {
  const digits = digitsOnlyPhone(raw);
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  return digits;
}

export function isValidEnquiryPhone(raw: string) {
  const digits = digitsOnlyPhone(raw);
  return digits.length >= 10 && digits.length <= 15;
}

/** Public tel: link — keep leading + when present for international. */
export function enquiryTelHref(phone: string) {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) return `tel:+${digitsOnlyPhone(trimmed)}`;
  const digits = digitsOnlyPhone(trimmed);
  if (digits.length === 12 && digits.startsWith("91")) return `tel:+${digits}`;
  if (digits.length === 10) return `tel:+91${digits}`;
  return digits ? `tel:+${digits}` : "tel:";
}

export const publicEnquirySchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your name").max(128),
    phone: z
      .string()
      .trim()
      .min(10, "Enter a valid WhatsApp number")
      .max(32)
      .refine(isValidEnquiryPhone, "Enter a valid WhatsApp number"),
    email: z
      .string()
      .trim()
      .max(256)
      .email("Enter a valid email")
      .or(z.literal(""))
      .optional()
      .transform((value) => (value && value.length > 0 ? value : undefined)),
    eventType: optionalTrimmed(128),
    eventDate: z
      .string()
      .trim()
      .max(32)
      .optional()
      .transform((value) => (value && value.length > 0 ? value : undefined))
      .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), {
        message: "Use a valid event date",
      }),
    budget: optionalTrimmed(128),
    message: z
      .string()
      .trim()
      .min(10, "Tell us a little about what you need")
      .max(4000, "Message is too long"),
    source: z.enum(ENQUIRY_SOURCES).default("general"),
    productId: z.number().int().positive().optional(),
    productSlug: z.string().trim().max(128).optional(),
    serviceId: z.string().trim().max(64).optional(),
    /** Honeypot — must stay empty. */
    website: z.string().max(200).optional(),
  })
  .strict();

export type PublicEnquiryInput = z.infer<typeof publicEnquirySchema>;

export const adminEnquiryStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(ENQUIRY_STATUSES),
});

export const adminEnquiryNotesSchema = z.object({
  id: z.number().int().positive(),
  adminNotes: z
    .string()
    .trim()
    .max(8000)
    .transform((value) => (value.length > 0 ? value : null)),
});

export const adminEnquiryUpdateSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(ENQUIRY_STATUSES),
  adminNotes: z
    .string()
    .trim()
    .max(8000)
    .transform((value) => (value.length > 0 ? value : null)),
});

export const adminEnquiryListFilterSchema = z.object({
  status: z.enum(ENQUIRY_STATUSES).or(z.literal("all")).default("all"),
  q: z.string().trim().max(128).optional(),
});

export type AdminEnquiryListFilter = z.infer<typeof adminEnquiryListFilterSchema>;

export type EnquiryRecord = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  eventType: string | null;
  eventDate: string | null;
  budget: string | null;
  message: string;
  source: string;
  productId: number | null;
  productNameSnapshot: string | null;
  serviceId: string | null;
  serviceTitleSnapshot: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export function serializeEnquiry(row: {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  eventType: string | null;
  eventDate: string | null;
  budget: string | null;
  message: string;
  source: string;
  productId: number | null;
  productNameSnapshot: string | null;
  serviceId: string | null;
  serviceTitleSnapshot: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): EnquiryRecord {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    eventType: row.eventType,
    eventDate: row.eventDate,
    budget: row.budget,
    message: row.message,
    source: row.source,
    productId: row.productId,
    productNameSnapshot: row.productNameSnapshot,
    serviceId: row.serviceId,
    serviceTitleSnapshot: row.serviceTitleSnapshot,
    status: row.status,
    adminNotes: row.adminNotes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const ENQUIRY_SOURCE_LABELS: Record<EnquirySource, string> = {
  general: "General enquiry",
  product: "Product enquiry",
  service: "Service enquiry",
  contact: "Contact page",
};

export function enquirySourceLabel(source: string) {
  if ((ENQUIRY_SOURCES as readonly string[]).includes(source)) {
    return ENQUIRY_SOURCE_LABELS[source as EnquirySource];
  }
  return "Enquiry";
}

export function enquiryInterestLabel(enquiry: {
  productNameSnapshot?: string | null;
  serviceTitleSnapshot?: string | null;
  source: string;
}) {
  if (enquiry.productNameSnapshot) return enquiry.productNameSnapshot;
  if (enquiry.serviceTitleSnapshot) return enquiry.serviceTitleSnapshot;
  return enquirySourceLabel(enquiry.source);
}

export function buildVisitorWhatsAppMessage(input: {
  name: string;
  eventType?: string;
  eventDate?: string;
  budget?: string;
  productName?: string;
  serviceTitle?: string;
  message: string;
}) {
  const lines = ["Hello DaintyHand,", "I just sent an enquiry.", "", `Name: ${input.name}`];
  if (input.productName) lines.push(`Product: ${input.productName}`);
  if (input.serviceTitle) lines.push(`Service: ${input.serviceTitle}`);
  if (input.eventType) lines.push(`Event: ${input.eventType}`);
  if (input.eventDate) lines.push(`Date: ${input.eventDate}`);
  if (input.budget) lines.push(`Budget: ${input.budget}`);
  lines.push("", input.message);
  return lines.join("\n");
}

export function buildAdminWhatsAppMessage(enquiry: {
  name: string;
  productNameSnapshot?: string | null;
  serviceTitleSnapshot?: string | null;
  eventType?: string | null;
  eventDate?: string | null;
}) {
  const interest =
    enquiry.productNameSnapshot ||
    enquiry.serviceTitleSnapshot ||
    enquiry.eventType ||
    "your recent enquiry";
  const lines = [`Hi ${enquiry.name}, this is DaintyHand regarding your enquiry for ${interest}.`];
  if (enquiry.eventDate) lines.push(`Event date: ${enquiry.eventDate}`);
  lines.push("Happy to help whenever you are free.");
  return lines.join("\n");
}

export function isEnquiryStatus(value: string): value is EnquiryStatus {
  return (ENQUIRY_STATUSES as readonly string[]).includes(value);
}
