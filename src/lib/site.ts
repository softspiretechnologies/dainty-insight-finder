const PLACEHOLDER_WHATSAPP = "919999999999";
const INSTAGRAM_URL = "https://www.instagram.com/dainty.handd/";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

/** Static fallback when MySQL is unavailable (local dev without DATABASE_URL). */
const WHATSAPP_NUMBER = PLACEHOLDER_WHATSAPP;

/** Override with VITE_SITE_URL when deploying to a custom domain. */
const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SITE_URL) ||
  "https://dainty-insight-finder.lovable.app";

export const site = {
  name: "DaintyHand",
  tagline: "Delicate Touches, Lasting Impressions.",
  heroLine1: "Your plans,",
  heroLine2: "Our goals.",
  location: "Perinthalmanna, Malappuram, Kerala",
  founder: "Nafisa",
  instagramHandle: "@dainty.handd",
  instagramUrl: INSTAGRAM_URL,
  whatsappNumber: WHATSAPP_NUMBER,
  email: "hello@daintyhand.in",
  hours: "Mon – Sat · 10:00 AM – 7:00 PM",
  baseUrl: BASE_URL.replace(/\/$/, ""),
};

/** Prefer MySQL admin settings; fall back to static default only when DB has no value. */
export function resolveWhatsAppNumber(fromDb?: string | null) {
  const fromSettings = fromDb ? digitsOnly(fromDb) : "";
  if (fromSettings) return fromSettings;
  return WHATSAPP_NUMBER;
}

/** JSON-LD telephone format, e.g. 919876543210 → +91-9876543210 */
export function formatTelephone(number: string) {
  const digits = digitsOnly(number);
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91-${digits.slice(2)}`;
  }
  if (digits.length === 10) {
    return `+91-${digits}`;
  }
  return digits ? `+${digits}` : "";
}

/** Build an absolute site URL from a path (e.g. `/catalog` → `https://…/catalog`). */
export function siteUrl(path = "/") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return `${site.baseUrl}/`;
  return `${site.baseUrl}${normalized}`;
}

export function whatsappLink(message?: string, number = WHATSAPP_NUMBER) {
  const base = `https://wa.me/${digitsOnly(number)}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
