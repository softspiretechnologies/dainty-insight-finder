const WHATSAPP_NUMBER = "919999999999"; // TODO: replace with real WhatsApp number
const INSTAGRAM_URL = "https://www.instagram.com/dainty.handd/";

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
};

export function whatsappLink(message?: string) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}