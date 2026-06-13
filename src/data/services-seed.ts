import type { ServiceId } from "@/types/catalog";

export const serviceIds = [
  "save-the-date-shoots",
  "birthday-surprise-planning",
  "proposal-setups",
  "couple-shoots",
  "reels-memory-videos",
] as const;

export type SeedServiceId = (typeof serviceIds)[number];

export const seedServices: Array<{
  id: ServiceId;
  title: string;
  blurb: string;
  bullets: string[];
  sortOrder: number;
}> = [
  {
    id: "save-the-date-shoots",
    title: "Save The Date Shoots",
    blurb:
      "A 1–2 hour styled couple shoot, edited as a save-the-date film with matching cards. Locations across India — Perinthalmanna, Kozhikode, Kochi, Bengaluru, Dubai and beyond.",
    bullets: ["Styled couple shoot", "Edited reel + stills", "Save-the-date card design", "Packages from ₹12,000"],
    sortOrder: 0,
  },
  {
    id: "birthday-surprise-planning",
    title: "Birthday Surprise Planning",
    blurb:
      "Decor concept, balloons, florals, signage and styled cake table — set up at home or venue while the guest of honour is away.",
    bullets: ["Decor + florals + signage", "Cake table styling", "Optional hamper add-on", "Packages from ₹4,500"],
    sortOrder: 1,
  },
  {
    id: "proposal-setups",
    title: "Proposal Setups",
    blurb:
      "A private styled setup — florals, candles, signage, ring tray and an optional reel — for proposals at home, terrace or venue.",
    bullets: ["Styled florals & candles", "Custom signage", "Ring tray & hamper option", "Reel video add-on"],
    sortOrder: 2,
  },
  {
    id: "couple-shoots",
    title: "Couple Shoots",
    blurb:
      "Editorial pre-wedding and anniversary couple shoots — softly styled, candid, and edited in our warm signature tone.",
    bullets: ["Styled outdoor / indoor shoot", "Wardrobe & prop guidance", "25+ edited portraits", "Reel highlight add-on"],
    sortOrder: 3,
  },
  {
    id: "reels-memory-videos",
    title: "Reels & Memory Videos",
    blurb:
      "Short reels and edited videos from your photos and clips — for birthdays, anniversaries, engagement surprises and couple stories.",
    bullets: ["30–60s cinematic reels", "Birthday & anniversary edits", "Engagement & couple videos", "From ₹1,500"],
    sortOrder: 4,
  },
];

export const defaultServicesPageContent = {
  intro:
    "From save-the-date shoots and birthday surprises to proposal styling and edited memory videos — every service is planned around your story.",
  footerTitle: "Planning something else?",
  footerBlurb:
    "We also style proposals, nikahs, couple shoots and intimate celebrations. Tell us what you have in mind.",
};
