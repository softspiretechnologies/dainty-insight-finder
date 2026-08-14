export type AnalyticsEvent =
  | "product_view"
  | "catalog_category_filter"
  | "whatsapp_product_click"
  | "whatsapp_custom_order_click"
  | "whatsapp_contact_click"
  | "instagram_click"
  | "blog_view";

export type AnalyticsMetadata = {
  product_slug?: string;
  category?: string;
  source_page?: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(event: AnalyticsEvent, metadata: AnalyticsMetadata = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", event, metadata);
}
