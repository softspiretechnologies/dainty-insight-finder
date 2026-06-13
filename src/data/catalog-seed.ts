import type { CategoryId } from "@/types/catalog";

export const seedCategories: { id: CategoryId; label: string; blurb: string }[] = [
  { id: "hampers", label: "Custom Hampers", blurb: "Luxury hampers for weddings, birthdays, anniversaries and corporate gifting." },
  { id: "bouquets", label: "Bouquets", blurb: "Fresh, chocolate and cash bouquets, fully customised for the occasion." },
  { id: "invitations", label: "Invitations", blurb: "Wedding, nikah, engagement invitations and save-the-date cards." },
  { id: "engagement", label: "Engagement Gifts", blurb: "Proposal boxes, ring trays, engagement hampers and couple gift sets." },
  { id: "frames", label: "Frames & Acrylic Gifts", blurb: "Acrylic keepsakes, couple frames and personalised memory pieces." },
  { id: "albums", label: "Albums & Keepsakes", blurb: "Wedding albums, memory books and personalised keepsakes." },
  { id: "calligraphy", label: "Calligraphy", blurb: "Arabic calligraphy, name art, custom typography and event signage." },
  { id: "celebrations", label: "Celebration Services", blurb: "Save-the-date shoots, birthday surprises, proposal setups and event styling." },
];

export const seedProducts: {
  slug: string;
  name: string;
  category: CategoryId;
  blurb: string;
  description: string;
  details: string[];
  priceFrom?: string;
}[] = [
  {
    slug: "ribbon-wrap-hamper",
    name: "Ribbon Wrap Hamper",
    category: "hampers",
    blurb: "A cream box tied in soft satin, finished with dried blooms.",
    description:
      "Our signature hamper — hand-wrapped in heavy cream paper and finished with a soft peach satin ribbon and a sprig of dried flowers. Curated with local artisan chocolates, a soy candle, and a hand-written note.",
    details: ["Cream giftbox · 25 × 25 cm", "Satin ribbon (8 colours)", "3–4 curated artisan items", "Hand-written note"],
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
    priceFrom: "₹2,400",
  },
  {
    slug: "chocolate-bouquet",
    name: "Chocolate Bouquet",
    category: "bouquets",
    blurb: "A hand-tied bouquet of premium chocolates and dried florals.",
    description:
      "Premium chocolates hand-tied into a bouquet form with dried florals and ribbon. Choose chocolate brand, size and wrap colour.",
    details: ["12–24 chocolates", "Dried floral accents", "Custom ribbon colour", "Gift card included"],
    priceFrom: "₹1,100",
  },
  {
    slug: "cash-bouquet",
    name: "Cash Bouquet",
    category: "bouquets",
    blurb: "Currency notes folded and arranged as a bouquet keepsake.",
    description:
      "A bouquet of crisp currency notes folded into rosettes and arranged with dried florals — a thoughtful surprise for graduations, weddings and farewells.",
    details: ["You provide the notes", "Custom denomination layout", "Florals & wrap of choice", "Discreet hand-delivery"],
    priceFrom: "₹700 (excl. notes)",
  },
  {
    slug: "acrylic-couple-frame",
    name: "Acrylic Couple Frame",
    category: "frames",
    blurb: "Crystal-clear acrylic frame with a printed couple portrait.",
    description:
      "A floating, edge-polished acrylic block with a UV-printed couple portrait. Optional gold-leaf names and date on the base.",
    details: ["Edge-polished acrylic", "UV-printed photo", "Optional gold-leaf names", "Multiple sizes: A5 / A4 / A3"],
    priceFrom: "₹1,300",
  },
  {
    slug: "memory-frame",
    name: "Personalised Memory Frame",
    category: "frames",
    blurb: "Layered keepsake frame with photo, names and a hand-written date.",
    description:
      "A layered frame combining your photo, hand-lettered names and a meaningful date. Designed to sit as a centrepiece on a side table.",
    details: ["Cream mount + cream frame", "Hand-lettered names", "Date or vows option", "Wall mount / table stand"],
    priceFrom: "₹950",
  },
  {
    slug: "wedding-album",
    name: "Heirloom Wedding Album",
    category: "albums",
    blurb: "A premium hand-bound album with linen cover and matte prints.",
    description:
      "A 30–80 page hand-bound wedding album with cream linen cover, layflat binding and archival matte prints. Includes hand-lettered names on the spine.",
    details: ["Layflat binding", "Archival matte prints", "Linen / leatherette covers", "30 / 50 / 80 page options"],
    priceFrom: "₹6,500",
  },
  {
    slug: "memory-book",
    name: "Memory Book Keepsake",
    category: "albums",
    blurb: "A small bound book for letters, photos and pressed mementos.",
    description:
      "A small bound book to gather letters, photos, pressed flowers and notes — perfect as a birthday or anniversary gift from a group of friends.",
    details: ["A5 hand-bound book", "Cream archival paper", "Pre-set prompt pages", "Slipcase optional"],
    priceFrom: "₹1,200",
  },
  {
    slug: "arabic-name-calligraphy",
    name: "Arabic Name Calligraphy",
    category: "calligraphy",
    blurb: "Hand-rendered Arabic calligraphy of a name or verse.",
    description:
      "Hand-rendered Arabic calligraphy of a name, verse or dua, finished on cream paper with optional gold-leaf and a frame.",
    details: ["Hand-rendered (not printed)", "Cream / black paper", "Optional gold-leaf accents", "Framed option available"],
    priceFrom: "₹850",
  },
  {
    slug: "event-signage-set",
    name: "Event Signage Set",
    category: "calligraphy",
    blurb: "Welcome board, seating chart and table numbers in custom script.",
    description:
      "A coordinated event signage set — welcome board, seating chart and table numbers — hand-lettered in your chosen script and palette.",
    details: ["Welcome board + chart + numbers", "Acrylic / mirror / wood", "Easel & stands included", "Setup support on request"],
    priceFrom: "₹4,500",
  },
  {
    slug: "save-the-date-shoot",
    name: "Save The Date Shoot",
    category: "celebrations",
    blurb: "A short couple shoot styled and edited as your save-the-date.",
    description:
      "A 1–2 hour styled couple shoot at your chosen location, edited as a save-the-date film and matching still cards.",
    details: ["1–2 hour styled shoot", "Edited 30–45s film", "10 edited stills", "Save-the-date card design"],
    priceFrom: "₹12,000",
  },
  {
    slug: "birthday-surprise-setup",
    name: "Birthday Surprise Setup",
    category: "celebrations",
    blurb: "A fully planned and styled birthday surprise at home or venue.",
    description:
      "Decor concept, balloons, florals, signage, cake table styling and a curated gift hamper — set up at home or venue while the guest of honour is away.",
    details: ["Decor + florals + signage", "Cake table styling", "Optional hamper add-on", "On-site setup + teardown"],
    priceFrom: "₹4,500",
  },
  {
    slug: "proposal-setup",
    name: "Proposal Setup",
    category: "celebrations",
    blurb: "An intimate styled setup for the moment you ask.",
    description:
      "A private styled setup — florals, candles, signage, ring tray and optional reel video — for proposals at home, terrace or venue.",
    details: ["Styled florals + candles", "Custom signage", "Ring tray & hamper option", "Reel video add-on"],
    priceFrom: "₹6,500",
  },
  {
    slug: "memory-reel",
    name: "Memory Reel Video",
    category: "celebrations",
    blurb: "A short edited reel from your photos & clips, set to music.",
    description:
      "Send us your photos and short clips and we'll edit a 30–60 second cinematic reel for birthdays, anniversaries or engagement surprises.",
    details: ["30–60s edited reel", "Licensed music", "Two revision rounds", "Vertical / square delivery"],
    priceFrom: "₹1,500",
  },
  {
    slug: "nikah-invitation-suite",
    name: "Nikah Invitation Suite",
    category: "invitations",
    blurb: "A quiet, elegant nikah invitation with bilingual setting.",
    description:
      "A modern nikah invitation suite — invitation, RSVP and details card — set in clean type with optional Arabic calligraphy header.",
    details: ["Bilingual setting", "Optional Arabic header", "Cream / sand / ivory papers", "Min order 50"],
    priceFrom: "₹75 / suite",
  },
];
