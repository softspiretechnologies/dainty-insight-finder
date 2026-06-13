const WHATSAPP_NUMBER = "919999999999"; // TODO: replace with real WhatsApp number
const INSTAGRAM_URL = "https://www.instagram.com/dainty.handd/";

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

/** Build an absolute site URL from a path (e.g. `/catalog` → `https://…/catalog`). */
export function siteUrl(path = "/") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return `${site.baseUrl}/`;
  return `${site.baseUrl}${normalized}`;
}

export function whatsappLink(message?: string) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
