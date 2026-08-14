import type { CatalogProduct } from "@/types/catalog";

import { siteUrl } from "./site";

export function parseProductPrice(value: string | undefined) {
  if (!value?.trim()) return undefined;
  const normalized = value.replace(/[₹,\s]/g, "").replace(/^(from|inr)/i, "");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return undefined;
  const price = Number(normalized);
  return Number.isFinite(price) && price > 0 ? normalized : undefined;
}

export function absoluteProductImage(image: string | undefined) {
  if (!image?.trim()) return siteUrl("/og-image.jpg");
  if (/^https?:\/\//i.test(image)) return image;
  return siteUrl(image);
}

export function buildProductStructuredData(product: CatalogProduct, description: string) {
  const url = siteUrl(`/catalog/${product.slug}`);
  const price = parseProductPrice(product.priceFrom);
  return {
    "@type": "Product",
    name: product.name,
    description,
    image: absoluteProductImage(product.image),
    url,
    brand: { "@type": "Brand", name: "DaintyHand" },
    ...(price
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "INR",
            price,
            url,
          },
        }
      : {}),
  };
}
