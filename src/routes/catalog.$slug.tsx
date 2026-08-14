import { createFileRoute, Link, notFound, useRouteContext } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { OptimizedImage, productHeroSizes } from "@/components/ui/optimized-image";
import { getProductBySlugData } from "@/lib/api/catalog";
import { normalizeProductDetails } from "@/lib/product-details";
import { siteUrl } from "@/lib/site";
import { absoluteProductImage, buildProductStructuredData } from "@/lib/product-schema";
import { useSiteContact } from "@/hooks/useSiteContact";
import { trackEvent } from "@/lib/analytics";
import { useEffect } from "react";

export const Route = createFileRoute("/catalog/$slug")({
  loader: async ({ params }) => {
    const product = await getProductBySlugData({ data: { slug: params.slug } });
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    const product = loaderData?.product;
    if (!product) {
      return { meta: [{ title: "Not found — DaintyHand" }] };
    }
    const url = siteUrl(`/catalog/${product.slug}`);
    const metaDescription =
      product.description && product.description.length > 30
        ? product.description
        : `${product.name} — custom handcrafted by DaintyHand in Perinthalmanna, Kerala. Fully personalized for weddings, engagements, Nikahs & celebrations. Ships across India & worldwide.`;
    const productImage = absoluteProductImage(product.image);

    return {
      meta: [
        { title: `${product.name} | Custom Gifts & Hampers - DaintyHand Kerala` },
        { name: "description", content: metaDescription },
        {
          name: "keywords",
          content: `${product.name}, custom hampers Kerala, Nikah gifts, wedding hampers Perinthalmanna, DaintyHand`,
        },
        {
          property: "og:title",
          content: `${product.name} | Custom Gifts & Hampers - DaintyHand Kerala`,
        },
        { property: "og:description", content: metaDescription },
        { property: "og:url", content: url },
        { property: "og:image", content: productImage },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: productImage },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: siteUrl("/") },
                  { "@type": "ListItem", position: 2, name: "Catalog", item: siteUrl("/catalog") },
                  { "@type": "ListItem", position: 3, name: product.name, item: url },
                ],
              },
              buildProductStructuredData(product, metaDescription),
            ],
          }),
        },
      ],
    };
  },
  component: ProductPage,
  notFoundComponent: () => (
    <PageShell>
      <div className="max-w-3xl mx-auto px-6 py-32 text-center">
        <h1 className="font-display text-5xl italic mb-4">Piece not found</h1>
        <p className="text-sm text-muted mb-8">That one's no longer on display.</p>
        <Link
          to="/catalog"
          className="text-[11px] uppercase tracking-widest font-semibold border-b border-foreground pb-0.5"
        >
          Back to catalog
        </Link>
      </div>
    </PageShell>
  ),
  errorComponent: ({ reset }) => (
    <PageShell>
      <div className="max-w-3xl mx-auto px-6 py-32 text-center">
        <h1 className="font-display text-3xl italic mb-4">Something went wrong</h1>
        <button
          onClick={() => reset()}
          className="text-[11px] uppercase tracking-widest font-semibold border-b border-foreground pb-0.5"
        >
          Try again
        </button>
      </div>
    </PageShell>
  ),
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const { categories } = useRouteContext({ from: "__root__" });
  const { waLink, founder } = useSiteContact();
  const category = categories.find((c) => c.id === product.category);
  const details = normalizeProductDetails(product.details);

  useEffect(() => {
    trackEvent("product_view", { product_slug: product.slug, category: product.category });
  }, [product.category, product.slug]);

  return (
    <PageShell>
      <section className="px-5 md:px-6 pt-8 md:pt-12 pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto">
          <Link
            to="/catalog"
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted hover:text-primary inline-block mb-6 md:mb-12"
          >
            ← Back to catalog
          </Link>

          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 md:gap-16 items-start">
            <div className="aspect-4/5 overflow-hidden bg-surface">
              <OptimizedImage
                src={product.image}
                alt={`${product.name} handcrafted by DaintyHand in Perinthalmanna, Kerala`}
                width={1024}
                height={1280}
                sizes={productHeroSizes}
                priority
                className="w-full h-full object-cover"
              />
            </div>

            <div className="min-w-0 lg:sticky lg:top-24">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
                {category?.label}
              </span>
              <h1 className="break-words font-display text-3xl sm:text-4xl md:text-6xl tracking-tighter mt-3 mb-5 md:mb-6 leading-[0.95] text-balance">
                {product.name}
              </h1>
              <p className="text-sm text-muted leading-relaxed mb-8 md:mb-10 text-pretty whitespace-pre-line">
                {product.description}
              </p>

              <ul className="space-y-3 mb-8 md:mb-12 border-t border-border pt-5 md:pt-6">
                {details.map((d) => (
                  <li key={d} className="flex gap-3 text-sm">
                    <span className="font-mono text-[10px] text-muted pt-1">·</span>
                    <span className="min-w-0 break-words">{d}</span>
                  </li>
                ))}
              </ul>

              <div className="mb-8 md:mb-10 border border-border rounded-sm p-5 sm:p-6 bg-surface/50">
                <p className="font-display italic text-base mb-3">
                  Every creation is made to order and fully customisable.
                </p>
                <p className="text-xs text-muted mb-4">Customise across:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Names",
                    "Colours",
                    "Themes",
                    "Flowers",
                    "Packaging",
                    "Messages",
                    "Event Type",
                  ].map((o) => (
                    <span
                      key={o}
                      className="font-mono text-[10px] uppercase tracking-[0.15em] border border-border rounded-full px-3 py-1"
                    >
                      {o}
                    </span>
                  ))}
                </div>
              </div>

              <a
                href={waLink(
                  `Hi ${founder}, I'd like to request the "${product.name}". Could we discuss customisation?`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackEvent("whatsapp_product_click", {
                    product_slug: product.slug,
                    category: product.category,
                    source_page: "product",
                  })
                }
                className="inline-flex min-h-11 w-full sm:w-auto min-w-0 items-center justify-center gap-3 break-words bg-foreground text-background px-5 sm:px-8 py-4 rounded-full text-center text-xs font-semibold uppercase tracking-widest hover:bg-primary transition-all active:scale-95 group"
              >
                Discuss this design on WhatsApp
                <span className="w-5 h-px bg-background/40 group-hover:w-8 transition-all" />
              </a>
              <p className="text-[11px] text-muted mt-4">
                We'll talk through your idea, share visuals and confirm pricing before anything is
                made.
              </p>

              <div className="mt-8 min-w-0 pt-6 border-t border-border flex flex-wrap gap-4 text-xs">
                <Link
                  to="/catalog"
                  search={{ category: product.category }}
                  className="min-w-0 break-words text-muted hover:text-primary transition-colors underline underline-offset-4"
                >
                  More from {category?.label} →
                </Link>
                <Link
                  to="/services"
                  className="min-w-0 break-words text-muted hover:text-primary transition-colors underline underline-offset-4"
                >
                  Explore Celebration Shoots &amp; Styling →
                </Link>
                <Link
                  to="/blog"
                  className="min-w-0 break-words text-muted hover:text-primary transition-colors underline underline-offset-4"
                >
                  Read Wedding &amp; Gifting Guides →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
