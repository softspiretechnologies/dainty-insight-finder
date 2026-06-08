import hampersImg from "@/assets/service-hampers.jpg";
import bouquetsImg from "@/assets/service-bouquets.jpg";
import invitationsImg from "@/assets/service-invitations.jpg";
import engagementImg from "@/assets/service-engagement.jpg";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import gallery5 from "@/assets/gallery-5.jpg";
import gallery6 from "@/assets/gallery-6.jpg";

export type Category = "hampers" | "bouquets" | "invitations" | "engagement";

export const categories: { id: Category; label: string; blurb: string }[] = [
  { id: "hampers", label: "Gift Hampers", blurb: "Themed collections curated with local artisanal finds." },
  { id: "bouquets", label: "Bouquets", blurb: "Fresh, seasonal arrangements inspired by Kerala's gardens." },
  { id: "invitations", label: "Invitations", blurb: "Letterpress and foil invitations on heavy cotton paper." },
  { id: "engagement", label: "Engagement", blurb: "Bespoke gift boxes for the perfect beginning." },
];

export type Product = {
  slug: string;
  name: string;
  category: Category;
  blurb: string;
  description: string;
  details: string[];
  image: string;
  priceFrom?: string;
};

export const products: Product[] = [
  {
    slug: "ribbon-wrap-hamper",
    name: "Ribbon Wrap Hamper",
    category: "hampers",
    blurb: "A cream box tied in soft satin, finished with dried blooms.",
    description:
      "Our signature hamper — hand-wrapped in heavy cream paper and finished with a soft peach satin ribbon and a sprig of dried flowers. Curated with local artisan chocolates, a soy candle, and a hand-written note.",
    details: ["Cream giftbox · 25 × 25 cm", "Satin ribbon (8 colours)", "3–4 curated artisan items", "Hand-written note"],
    image: hampersImg,
    priceFrom: "₹1,200",
  },
  {
    slug: "wax-seal-keepsake",
    name: "Wax Seal Keepsake",
    category: "hampers",
    blurb: "Sealed with a custom monogram and silk ribbon.",
    description:
      "A heirloom-feel keepsake box closed with a hand-pressed wax seal and a peach silk ribbon. Choose your monogram and the box is sealed in front of camera for your unboxing reel.",
    details: ["Custom wax seal monogram", "Cream linen lining", "Personalised card", "Unboxing video on request"],
    image: gallery1,
    priceFrom: "₹1,800",
  },
  {
    slug: "candle-and-cotton-hamper",
    name: "Candle & Cotton Hamper",
    category: "hampers",
    blurb: "Soy candle, hand soap and dried florals in a cotton pouch.",
    description:
      "A soft, slow-living hamper for housewarmings and thank-yous. Soy candle and hand soap from a Kochi maker, dried florals and a raw cotton pouch tied with twine.",
    details: ["Soy candle 200g", "Botanical hand soap", "Dried floral bunch", "Cotton pouch + twine"],
    image: gallery6,
    priceFrom: "₹1,400",
  },
  {
    slug: "garden-meadow-bouquet",
    name: "Garden Meadow Bouquet",
    category: "bouquets",
    blurb: "Wildflowers, jasmine and pastel blooms in handmade paper.",
    description:
      "An airy, garden-gathered bouquet of seasonal blooms — jasmine, cosmos, cottage roses and feathery greens — wrapped in soft handmade paper.",
    details: ["~35 stems, seasonal", "Handmade paper wrap", "Same-day delivery in Pmna", "Refresh care card included"],
    image: bouquetsImg,
    priceFrom: "₹950",
  },
  {
    slug: "jasmine-marigold-arrangement",
    name: "Jasmine & Marigold Arrangement",
    category: "bouquets",
    blurb: "A close-set posy in fresh jasmine and golden marigold.",
    description:
      "A close, low arrangement of fresh jasmine and golden marigold — perfect for haldi, mehndi and engagement table styling.",
    details: ["~10 inches across", "Fresh-cut day-of-event", "Bulk pricing for events", "Locally sourced"],
    image: gallery2,
    priceFrom: "₹600",
  },
  {
    slug: "cotton-paper-invitation-suite",
    name: "Cotton Paper Invitation Suite",
    category: "invitations",
    blurb: "Hand-set type on heavy cotton with a peach silk ribbon.",
    description:
      "A four-piece suite — invitation, RSVP, details card and silk-tied envelope — printed in fine type on 600gsm cotton paper. Bilingual setting available.",
    details: ["600gsm cotton paper", "Envelope, RSVP & details card", "Silk ribbon closure", "Bilingual setting"],
    image: invitationsImg,
    priceFrom: "₹85 / suite",
  },
  {
    slug: "kerala-script-card",
    name: "Kerala Script Card",
    category: "invitations",
    blurb: "Modern Kerala wedding card with hand-lettered names.",
    description:
      "A single-fold modern wedding card with hand-lettered names and a botanical sprig. Designed quietly, set in soft warm ink.",
    details: ["Single-fold A5", "Hand-lettered names", "Dried sprig motif", "Min order 50"],
    image: gallery3,
    priceFrom: "₹55 / card",
  },
  {
    slug: "place-card-set",
    name: "Calligraphy Place Cards",
    category: "invitations",
    blurb: "Hand-written place cards on cream cardstock.",
    description:
      "Hand-written calligraphy place cards on heavy cream cardstock. Choose ink colour and script style; delivered ready to set.",
    details: ["Cream 350gsm card", "5 script styles", "Brown / black / sepia ink", "Min order 20"],
    image: gallery5,
    priceFrom: "₹45 / card",
  },
  {
    slug: "ring-box-hamper",
    name: "Engagement Ring Box Hamper",
    category: "engagement",
    blurb: "A cream velvet ring tray nested in dried florals.",
    description:
      "A cream velvet ring tray cradled in a bed of dried florals — designed to hold the moment and become the keepsake afterwards.",
    details: ["Cream velvet tray", "Dried floral bed", "Optional monogram", "Hand-delivered in Pmna"],
    image: engagementImg,
    priceFrom: "₹2,200",
  },
  {
    slug: "promise-chest",
    name: "The Promise Chest",
    category: "engagement",
    blurb: "A small wooden chest of curated treats and a candle.",
    description:
      "A small wooden chest in deep burgundy lining, filled with artisan chocolates, a hand-poured candle and dried flowers — for the day someone says yes.",
    details: ["Wooden chest 22 × 18 cm", "Artisan chocolate selection", "Hand-poured candle", "Dried floral accent"],
    image: gallery4,
    priceFrom: "₹2,400",
  },
];

export const galleryImages = [
  { src: gallery1, alt: "Cream gift box sealed with wax", w: 640, h: 800, span: "tall" as const },
  { src: gallery2, alt: "Jasmine and marigold arrangement", w: 640, h: 512, span: "wide" as const },
  { src: gallery3, alt: "Modern Kerala wedding card", w: 640, h: 960, span: "tall" as const },
  { src: gallery4, alt: "Engagement gift chest", w: 640, h: 640, span: "square" as const },
  { src: gallery5, alt: "Calligraphy place cards", w: 640, h: 512, span: "wide" as const },
  { src: gallery6, alt: "Candle and soap hamper", w: 640, h: 800, span: "tall" as const },
];