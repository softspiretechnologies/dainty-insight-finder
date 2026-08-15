import { parseProductPrice } from "@/lib/product-schema";

const inrAmount = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

/** Canonical amount for storage, e.g. "1800". Blank → undefined. */
export function normalizeProductPriceInput(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined;
  return parseProductPrice(raw);
}

/** Amount-only string for the Admin price input (no ₹). */
export function productPriceInputValue(stored: string | undefined): string {
  return normalizeProductPriceInput(stored) ?? "";
}

/**
 * Display currency for Admin / compact UI.
 * Numeric-compatible values → ₹1,800. Non-numeric legacy strings returned as-is.
 */
export function formatProductPrice(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  const amount = parseProductPrice(value);
  if (amount) return inrAmount.format(Number(amount));
  return value.trim();
}

/** Customer-facing "from" price, e.g. From ₹1,800. */
export function formatProductPriceFrom(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  const amount = parseProductPrice(value);
  if (amount) return `From ${inrAmount.format(Number(amount))}`;
  const trimmed = value.trim();
  if (/^from\s+/i.test(trimmed)) return trimmed;
  return `From ${trimmed}`;
}

/** True when blank or a valid positive amount (for Admin form validation). */
export function isValidProductPriceInput(raw: string | undefined): boolean {
  if (!raw?.trim()) return true;
  return Boolean(parseProductPrice(raw));
}
