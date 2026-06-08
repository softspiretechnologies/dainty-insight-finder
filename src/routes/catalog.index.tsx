import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/site/PageShell";
import { categories, products, type Category } from "@/data/products";
import { site, whatsappLink } from "@/lib/site";

export const Route = createFileRoute("/catalog/")({
  head: () => ({
    meta: [
      { title: "Catalog — Dainty Handd" },
      { name: "description", content: "Browse hampers, bouquets, invitations and engagement gifts handmade by Nafisa in Kerala." },
      { property: "og:title", content: "Catalog — Dainty Handd" },
      { property: "og:description", content: "Browse hampers, bouquets, invitations and engagement gifts handmade by Nafisa in Kerala." },
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
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">The Catalog</span>
          <h1 className="font-display text-5xl md:text-7xl tracking-tighter mt-4 mb-6 text-balance">
            Pieces, <span className="italic font-normal text-primary">all made by hand.</span>
          </h1>
          <p className="max-w-xl text-sm text-muted leading-relaxed text-pretty">
            A working catalog of past pieces — each one is a starting point, fully customised to your occasion. Pick one you like and we'll talk on WhatsApp.
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
                </div>
                {p.priceFrom ? (
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted shrink-0 pt-1">
                    From {p.priceFrom}
                  </span>
                ) : null}
              </div>
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