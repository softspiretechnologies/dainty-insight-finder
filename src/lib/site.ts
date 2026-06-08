const WHATSAPP_NUMBER = "919999999999"; // TODO: replace with real WhatsApp number
const INSTAGRAM_URL = "https://www.instagram.com/dainty.handd/";

export const site = {
  name: "Dainty Handd",
  tagline: "Your plans, Our goals.",
  location: "Perinthalmanna, Malappuram, Kerala",
  founder: "Nafisa",
  instagramHandle: "@dainty.handd",
  instagramUrl: INSTAGRAM_URL,
  whatsappNumber: WHATSAPP_NUMBER,
  email: "hello@daintyhandd.in",
};

export function whatsappLink(message?: string) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}