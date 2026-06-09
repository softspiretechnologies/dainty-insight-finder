import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/site/PageShell";
import { categories, products, type Category } from "@/data/products";
import { site, whatsappLink } from "@/lib/site";

export const Route = createFileRoute("/catalog/")({
  head: () => ({
    meta: [
      { title: "Past Creations — DaintyHand | Custom hampers, bouquets & gifts Kerala" },
      { name: "description", content: "Browse past creations: hampers, bouquets, invitations, engagement gifts, frames, calligraphy and celebration services — fully customisable, handcrafted in Kerala." },
      { property: "og:title", content: "Past Creations — DaintyHand" },
      { property: "og:description", content: "Browse past creations — every piece is fully customisable to your occasion." },
    ],
  }),
  component: CatalogPage,
});

type Filter = Category | "all";

function CatalogPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = filter === "all" ? products : products.filter((p) => p.category === filter);

  return (
    <PageShell>
      <section className="px-6 pt-20 pb-12">
        <div className="max-w-7xl mx-auto">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Past Creations</span>
          <h1 className="font-display text-5xl md:text-7xl tracking-tighter mt-4 mb-6 text-balance">
            A look at <span className="italic font-normal text-primary">past creations.</span>
          </h1>
          <p className="max-w-xl text-sm text-muted leading-relaxed text-pretty">
            Every piece below was made for someone — and every piece is a starting point. Pick what inspires you and we'll fully customise it for your occasion on WhatsApp.
          </p>
        </div>
      </section>

      <section className="px-6 border-y border-border">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-2 py-6">
          <Chip active={filter === "all"} onClick={() => setFilter("all")}>All</Chip>
          {categories.map((c) => (
            <Chip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>
              {c.label}
            </Chip>
          ))}
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {visible.map((p) => (
            <Link
              key={p.slug}
              to="/catalog/$slug"
              params={{ slug: p.slug }}
              className="group block"
            >
              <div className="aspect-[4/5] overflow-hidden bg-surface mb-5">
                <img
                  src={p.image}
                  alt={p.name}
                  width={512}
                  height={640}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted block mb-2">
                    {categories.find((c) => c.id === p.category)?.label}
                  </span>
                  <h3 className="font-display text-xl italic">{p.name}</h3>
                  <p className="text-xs text-muted leading-relaxed mt-2 max-w-xs">{p.blurb}</p>
                  <span className="inline-block mt-3 font-mono text-[9px] uppercase tracking-[0.2em] text-primary border border-primary/40 rounded-full px-2 py-0.5">
                    Fully customisable
                  </span>
                </div>
                {p.priceFrom ? (
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted shrink-0 pt-1 text-right">
                    Starting<br/>from {p.priceFrom}
                  </span>
                ) : null}
              </div>
              <a
                href={whatsappLink(`Hi ${site.founder}, I'd like to enquire about "${p.name}".`)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-4 inline-block text-[10px] uppercase tracking-widest font-semibold border-b border-foreground pb-0.5 hover:text-primary hover:border-primary"
              >
                Enquire on WhatsApp →
              </a>
            </Link>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="max-w-7xl mx-auto text-sm text-muted mt-12">Nothing in this category yet.</p>
        ) : null}
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto text-center border-t border-border pt-16">
          <h2 className="font-display text-3xl italic mb-4">Don't see what you want?</h2>
          <p className="text-sm text-muted mb-8 leading-relaxed">
            Almost everything is made-to-order. Tell {site.founder} what you have in mind.
          </p>
          <a
            href={whatsappLink(`Hi ${site.founder}, I'd like a custom piece — `)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-4 bg-foreground text-background px-8 py-4 rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-primary transition-all active:scale-95 group"
          >
            Start a custom order
            <span className="w-5 h-px bg-background/40 group-hover:w-8 transition-all" />
          </a>
        </div>
      </section>
    </PageShell>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] uppercase tracking-[0.2em] font-medium px-4 py-2 rounded-full border transition-colors ${
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-background text-muted border-border hover:text-foreground hover:border-foreground"
      }`}
    >
      {children}
    </button>
  );
}