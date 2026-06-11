import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { categories, products } from "@/data/products";
import { site, whatsappLink } from "@/lib/site";

export const Route = createFileRoute("/catalog/$slug")({
  loader: ({ params }) => {
    const product = products.find((p) => p.slug === params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    const product = loaderData?.product;
    if (!product) {
      return { meta: [{ title: "Not found — DaintyHand" }] };
    }
    return {
      meta: [
        { title: `${product.name} — DaintyHand` },
        { name: "description", content: product.blurb },
        { property: "og:title", content: `${product.name} — DaintyHand` },
        { property: "og:description", content: product.blurb },
        { property: "og:image", content: product.image },
        { name: "twitter:image", content: product.image },
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
  const category = categories.find((c) => c.id === product.category);

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
            <div className="aspect-[4/5] overflow-hidden bg-surface">
              <img
                src={product.image}
                alt={product.name}
                width={1024}
                height={1280}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="lg:sticky lg:top-24">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
                {category?.label}
              </span>
              <h1 className="font-display text-3xl sm:text-4xl md:text-6xl tracking-tighter mt-3 mb-5 md:mb-6 leading-[0.95] text-balance">
                {product.name}
              </h1>
              {product.priceFrom ? (
                <p className="font-mono text-[11px] uppercase tracking-widest text-primary mb-6 md:mb-8">
                  Starting from {product.priceFrom}
                </p>
              ) : null}
              <p className="text-sm text-muted leading-relaxed mb-8 md:mb-10 text-pretty">
                {product.description}
              </p>

              <ul className="space-y-3 mb-8 md:mb-12 border-t border-border pt-5 md:pt-6">
                {(product.details as string[]).map((d: string) => (
                  <li key={d} className="flex gap-3 text-sm">
                    <span className="font-mono text-[10px] text-muted pt-1">·</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>

              <div className="mb-8 md:mb-10 border border-border rounded-sm p-5 sm:p-6 bg-surface/50">
                <p className="font-display italic text-base mb-3">
                  Every creation is made to order and fully customisable.
                </p>
                <p className="text-xs text-muted mb-4">Customise across:</p>
                <div className="flex flex-wrap gap-2">
                  {["Names", "Colours", "Themes", "Flowers", "Packaging", "Messages", "Event Type"].map((o) => (
                    <span key={o} className="font-mono text-[10px] uppercase tracking-[0.15em] border border-border rounded-full px-3 py-1">
                      {o}
                    </span>
                  ))}
                </div>
              </div>

              <a
                href={whatsappLink(
                  `Hi ${site.founder}, I'd like to request the "${product.name}". Could we discuss customisation?`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-4 bg-foreground text-background px-6 sm:px-8 py-4 rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-primary transition-all active:scale-95 group"
              >
                Discuss this design on WhatsApp
                <span className="w-5 h-px bg-background/40 group-hover:w-8 transition-all" />
              </a>
              <p className="text-[11px] text-muted mt-4">
                We'll talk through your idea, share visuals and confirm pricing before anything is made.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}