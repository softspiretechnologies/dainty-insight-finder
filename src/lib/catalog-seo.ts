import type { CategoryId, SeoOverrides } from "@/types/catalog";

export const CATALOG_PAGE_SIZE = 12;
export const SEO_TITLE_MAX = 120;
export const SEO_DESCRIPTION_MAX = 320;

export const categorySeo = {
  hampers: {
    heading: "Custom Gift Hampers in Malappuram",
    description:
      "Explore handcrafted gift hampers for weddings, birthdays, anniversaries and special occasions. Personalise your hamper with DaintyHand in Perinthalmanna, Kerala.",
    productLabel: "Custom Gift Hampers",
  },
  bouquets: {
    heading: "Custom Bouquets in Perinthalmanna",
    description:
      "Explore custom chocolate, cash and floral bouquets from DaintyHand in Malappuram, Kerala. Find inspiration and enquire about a bouquet for your occasion.",
    productLabel: "Custom Bouquets",
  },
  invitations: {
    heading: "Wedding & Nikah Invitations in Kerala",
    description:
      "Explore personalised wedding, nikah and engagement invitations and save-the-date cards from DaintyHand in Perinthalmanna, Malappuram.",
    productLabel: "Wedding & Nikah Invitations",
  },
  engagement: {
    heading: "Personalised Engagement Gifts in Kerala",
    description:
      "Explore engagement hampers, proposal boxes, ring trays and couple gifts. Enquire about a customised creation from DaintyHand in Malappuram.",
    productLabel: "Engagement Gifts",
  },
  frames: {
    heading: "Personalised Frames & Acrylic Gifts in Malappuram",
    description:
      "Find inspiration for personalised frames, acrylic keepsakes and memory gifts handcrafted by DaintyHand in Perinthalmanna, Kerala.",
    productLabel: "Personalised Frames & Acrylic Gifts",
  },
  albums: {
    heading: "Custom Albums & Memory Keepsakes in Kerala",
    description:
      "Discover custom albums, memory books and keepsakes from DaintyHand in Malappuram. Enquire about a personalised gift for your special memories.",
    productLabel: "Custom Albums & Keepsakes",
  },
  calligraphy: {
    heading: "Custom Calligraphy Gifts in Kerala",
    description:
      "Explore Arabic calligraphy, personalised name art and custom typography by DaintyHand in Perinthalmanna, Malappuram.",
    productLabel: "Custom Calligraphy Gifts",
  },
  celebrations: {
    heading: "Celebration & Surprise Ideas in Malappuram",
    description:
      "Explore DaintyHand's past celebrations, surprise setups and creative occasion ideas in Kerala. Contact the studio to discuss your plans.",
    productLabel: "Celebration Creations",
  },
} satisfies Record<CategoryId, { heading: string; description: string; productLabel: string }>;

export type CatalogSearch = { category?: CategoryId | CategoryId[]; page?: number };

export function isSeoCategory(value: string): value is CategoryId {
  return Object.prototype.hasOwnProperty.call(categorySeo, value);
}

export function catalogPath(category?: CategoryId, page = 1): string {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/catalog?${query}` : "/catalog";
}

export function getCatalogSeo(
  search: CatalogSearch,
  products: ReadonlyArray<{ category: CategoryId }>,
  categories: ReadonlyArray<SeoOverrides & { id: string }> = [],
) {
  const selected = Array.isArray(search.category)
    ? [...new Set(search.category)]
    : search.category
      ? [search.category]
      : [];
  const category = selected.length === 1 && isSeoCategory(selected[0]) ? selected[0] : undefined;
  const copy = category ? categorySeo[category] : undefined;
  const overrides = category ? categories.find((item) => item.id === category) : undefined;
  const count = selected.length
    ? products.filter((product) => selected.includes(product.category)).length
    : products.length;
  const page = search.page ?? 1;
  const maxPage = Math.max(1, Math.ceil(count / CATALOG_PAGE_SIZE));
  const indexable =
    selected.length <= 1 &&
    (selected.length === 0 || Boolean(category && count)) &&
    Number.isSafeInteger(page) &&
    page >= 1 &&
    page <= maxPage;
  const title = copy?.heading ?? "Custom Hampers, Bouquets & Wedding Gifts in Kerala";
  const pageSuffix = page > 1 ? ` | Page ${page}` : "";
  const customTitle = overrides?.metaTitle?.trim();
  const intro =
    copy?.description ??
    "Browse handcrafted hampers, bouquets, invitations and keepsakes from DaintyHand in Perinthalmanna, Malappuram, Kerala.";
  return {
    category,
    title: customTitle ? `${customTitle}${pageSuffix}` : `${title}${pageSuffix} | DaintyHand`,
    heading: copy?.heading ?? "Past Creations & Custom Gifts",
    intro,
    description: overrides?.metaDescription?.trim() || intro,
    indexable,
    canonicalPath: indexable ? catalogPath(category, page) : undefined,
  };
}

export function productSeoTitle(name: string, category: CategoryId) {
  const label = isSeoCategory(category) ? categorySeo[category].productLabel : "Handcrafted Gifts";
  return `${name} | ${label} - DaintyHand Kerala`;
}

export function getProductSeo(
  product: SeoOverrides & {
    name: string;
    category: CategoryId;
    description: string;
    blurb: string;
  },
) {
  const description =
    product.metaDescription?.trim() ||
    [product.description, product.blurb].find((value) => value?.trim().length > 30)?.trim() ||
    `${product.name} — discover this past creation from DaintyHand in Perinthalmanna, Kerala. Enquire about personalisation for your occasion.`;
  return {
    title: product.metaTitle?.trim() || productSeoTitle(product.name, product.category),
    description,
  };
}

/** Escape the HTML script delimiter without altering the decoded JSON-LD values. */
export function serializeCatalogJsonLd(value: object) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
