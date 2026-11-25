import type { SiteSettingsData } from "@/types/catalog";

import { resolveSiteContact, site, siteUrl } from "./site";

export const businessId = () => siteUrl("/#organization");
export const websiteId = () => siteUrl("/#website");

export function businessReference() {
  return { "@id": businessId(), "@type": "Organization", name: site.name };
}

export function buildWebsiteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": websiteId(),
    name: site.name,
    url: siteUrl("/"),
    publisher: businessReference(),
  };
}

/** Only use an actual Instagram profile URL as a business identity link. */
function instagramProfileUrl(value: string) {
  try {
    const url = new URL(value);
    if (
      url.protocol === "https:" &&
      ["instagram.com", "www.instagram.com"].includes(url.hostname) &&
      /^\/[\w.]+\/?$/.test(url.pathname) &&
      !url.username &&
      !url.password
    ) {
      return `https://www.instagram.com${url.pathname.replace(/\/$/, "")}/`;
    }
  } catch {
    // Invalid URL: omit the identity link.
  }
  return undefined;
}

export function buildOrganizationStructuredData(settings?: Partial<SiteSettingsData>) {
  const contact = resolveSiteContact(settings);
  const instagram = instagramProfileUrl(contact.instagramUrl);
  const telephone =
    contact.whatsappNumber !== site.whatsappNumber &&
    /^\d{8,15}$/.test(contact.whatsappNumber)
      ? contact.telephone
      : undefined;

  // The site establishes a local studio and service areas, not a verified street address.
  // Do not publish a fabricated storefront, coordinates, hours, price range or ratings.
  return {
    ...businessReference(),
    url: siteUrl("/"),
    logo: siteUrl("/og-image.jpg"),
    description:
      "Handcrafted gift hampers, bouquets, wedding invitations, keepsakes and celebration services from DaintyHand.",
    location: { "@type": "Place", name: contact.location },
    areaServed: ["Perinthalmanna", "Malappuram", "Kerala", "India"],
    email: contact.email,
    ...(telephone ? { telephone } : {}),
    ...(instagram ? { sameAs: [instagram] } : {}),
    ...(contact.founder ? { founder: { "@type": "Person", name: contact.founder } } : {}),
  };
}

/** Shared visible homepage FAQs and structured data so the two cannot drift. */
export function getHomeFaq(location = site.location) {
  return [
    {
      q: "Where is DaintyHand based?",
      a: `DaintyHand is a handcrafted gifting and wedding celebration studio based in ${location}. Contact us for a custom order or to arrange a studio appointment.`,
    },
    {
      q: "How do I order a custom hamper or Nikah invitation suite?",
      a: "Browse our catalog or journal, pick what inspires you, and enquire on WhatsApp or fill out our custom order brief. We discuss colors, theme, budget and packaging with you before crafting your order.",
    },
    {
      q: "Do you ship custom gift hampers across Kerala, India, and internationally?",
      a: "We offer local hand-delivery in Perinthalmanna and Malappuram, courier delivery across India and international shipping. Contact us to confirm delivery options, timing and charges for your order.",
    },
    {
      q: "What celebration services does DaintyHand offer in Kerala?",
      a: "We offer save-the-date couple shoots, proposal setups, surprise birthday decor, couple portrait sessions and memory reels. Enquire about availability for your location and date.",
    },
    {
      q: "Can hampers, ring trays, and cards be personalized with names and custom dates?",
      a: "Yes. Customisation options include names, dates, colors, floral preferences and personal notes. Tell us your ideas so we can plan a creation for your occasion.",
    },
    {
      q: "How much does a custom gift hamper cost?",
      a: "Our catalog shows starting prices where available. The final quote depends on your chosen design, contents, personalisation and delivery. Share your occasion and budget for a personalised quote.",
    },
  ];
}

export function buildFaqStructuredData(location = site.location) {
  return {
    "@type": "FAQPage",
    mainEntity: getHomeFaq(location).map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}
