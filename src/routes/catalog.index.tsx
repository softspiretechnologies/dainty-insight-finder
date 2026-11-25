import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useMemo } from "react";

import { z } from "zod";
import { PageShell } from "@/components/site/PageShell";
import { OptimizedImage, catalogGridSizes } from "@/components/ui/optimized-image";
import { categories as staticCategories, type Category } from "@/data/products";
import { getCatalogProducts } from "@/lib/api/catalog";
import { site, siteUrl } from "@/lib/site";
import { useSiteContact } from "@/hooks/useSiteContact";
import { sortCategoriesWithSelectedFirst } from "@/lib/sort-categories-by-selection";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { getPaginationItems, type PaginationItem } from "@/lib/pagination";
import { formatProductPriceFrom } from "@/lib/product-price";
import { CATALOG_PAGE_SIZE, getCatalogSeo, serializeCatalogJsonLd } from "@/lib/catalog-seo";

const PAGE_SIZE = CATALOG_PAGE_SIZE;

const categoryIds = staticCategories.map((c) => c.id) as [Category, ...Category[]];

const catalogSearchSchema = z.object({
  category: z.union([z.enum(categoryIds), z.array(z.enum(categoryIds))]).optional(),
  page: z.coerce.number().int().min(1).optional(),
});

function selectedCategoriesFromSearch(category: Category | Category[] | undefined) {
  if (!category) return new Set<Category>();
  if (Array.isArray(category)) return new Set(category);
  return new Set([category]);
}

function categorySearchParam(categories: Set<Category>) {
  if (categories.size === 0) return undefined;
  const values = [...categories];
  return values.length === 1 ? values[0] : values;
}

export const Route = createFileRoute("/catalog/")({
  validateSearch: catalogSearchSchema,
  loaderDeps: ({ search }) => ({ category: search.category, page: search.page }),
  loader: async ({ deps, context }) => {
    const products = await getCatalogProducts();
    return { products, seo: getCatalogSeo(deps, products, context.categories) };
  },
  head: ({ loaderData }) => {
    const seo = loaderData?.seo ?? getCatalogSeo({}, []);
    const url = seo.canonicalPath ? siteUrl(seo.canonicalPath) : undefined;
    return {
      meta: [
        { title: seo.title },
        { name: "description", content: seo.description },
        { name: "robots", content: seo.indexable ? "index, follow" : "noindex, follow" },
        { property: "og:title", content: seo.title },
        { property: "og:description", content: seo.description },
        { property: "og:url", content: url ?? siteUrl("/catalog") },
        { property: "og:image", content: siteUrl("/og-image.jpg") },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: seo.title },
        { name: "twitter:description", content: seo.description },
      ],
      links: url ? [{ rel: "canonical", href: url }] : [],
      scripts: url
        ? [
            {
              type: "application/ld+json",
              children: serializeCatalogJsonLd({
                "@context": "https://schema.org",
                "@graph": [
                  {
                    "@type": "BreadcrumbList",
                    itemListElement: [
                      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl("/") },
                      {
                        "@type": "ListItem",
                        position: 2,
                        name: "Catalog",
                        item: siteUrl("/catalog"),
                      },
                      ...(seo.category
                        ? [{ "@type": "ListItem", position: 3, name: seo.heading, item: url }]
                        : []),
                    ],
                  },
                  {
                    "@type": "CollectionPage",
                    name: seo.heading,
                    description: seo.description,
                    url,
                  },
                ],
              }),
            },
          ]
        : [],
    };
  },
  component: CatalogPage,
});

function CatalogPage() {
  const { categories } = useRouteContext({ from: "__root__" });
  const { waLink, founder } = useSiteContact();
  const { products, seo } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const selectedCategories = selectedCategoriesFromSearch(search.category);
  const page = search.page ?? 1;

  const filtered =
    selectedCategories.size === 0
      ? products
      : products.filter((product) => selectedCategories.has(product.category));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const updateSearch = (next: { categories?: Set<Category>; page?: number }) => {
    navigate({
      search: (prev) => ({
        category:
          "categories" in next ? categorySearchParam(next.categories ?? new Set()) : prev.category,
        page: "page" in next ? next.page : prev.page,
      }),
      replace: true,
    });
  };

  const addCategoryFilter = (categoryId: Category) => {
    const next = new Set(selectedCategories);
    next.add(categoryId);
    updateSearch({ categories: next, page: undefined });
    trackEvent("catalog_category_filter", { category: categoryId, source_page: "catalog" });
  };

  const removeCategoryFilter = (categoryId: Category) => {
    const next = new Set(selectedCategories);
    next.delete(categoryId);
    updateSearch({ categories: next, page: undefined });
  };

  const sortedCategories = useMemo(
    () => sortCategoriesWithSelectedFirst(categories, selectedCategories),
    [categories, selectedCategories],
  );

  return (
    <PageShell>
      <section className="px-5 md:px-6 pt-12 md:pt-20 pb-8 md:pb-12">
        <div className="max-w-7xl mx-auto">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
            Past Creations
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl tracking-tighter mt-4 mb-5 md:mb-6 text-balance">
            {seo.category ? (
              seo.heading
            ) : (
              <>
                A look at <span className="italic font-normal text-primary">past creations.</span>
              </>
            )}
          </h1>
          <p className="max-w-xl text-sm text-muted leading-relaxed text-pretty">
            {seo.category
              ? seo.intro
              : "Every piece below was made for someone — and every piece is a starting point. Pick what inspires you and we'll fully customise it for your occasion on WhatsApp."}
          </p>
        </div>
      </section>

      <section className="px-5 md:px-6 border-y border-border">
        <div className="max-w-7xl mx-auto flex gap-1.5 md:gap-2 py-3 md:py-6 overflow-x-auto overscroll-x-contain md:flex-wrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sortedCategories.map((category) => {
            const active = selectedCategories.has(category.id);
            return (
              <CategoryChip
                key={category.id}
                active={active}
                onSelect={() => addCategoryFilter(category.id)}
                onRemove={() => removeCategoryFilter(category.id)}
              >
                {category.label}
              </CategoryChip>
            );
          })}
        </div>
      </section>

      <section className="px-5 md:px-6 py-10 md:py-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-3 gap-x-4 sm:gap-x-8 gap-y-10 md:gap-y-16">
          {visible.map((p, index) => (
            <article key={p.slug} className="group flex min-w-0 max-w-full flex-col">
              <Link to="/catalog/$slug" params={{ slug: p.slug }} className="block">
                <div className="aspect-[4/5] overflow-hidden bg-surface mb-3 md:mb-5">
                  <OptimizedImage
                    src={p.image}
                    alt={p.name}
                    width={512}
                    height={640}
                    sizes={catalogGridSizes}
                    priority={index === 0 && safePage === 1}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              </Link>
              <div className="min-w-0">
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted truncate block">
                  {categories.find((c) => c.id === p.category)?.label}
                </span>
                <Link to="/catalog/$slug" params={{ slug: p.slug }}>
                  <h3 className="break-words font-display text-base sm:text-xl italic leading-tight mt-1.5 hover:text-primary transition-colors">
                    {p.name}
                  </h3>
                </Link>
                <p className="break-words text-[11px] sm:text-xs text-muted leading-relaxed mt-2 max-w-xs">
                  {p.blurb}
                </p>
                {p.priceFrom ? (
                  <p className="text-xs text-muted mt-1.5">{formatProductPriceFrom(p.priceFrom)}</p>
                ) : null}
                <div className="mt-3">
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary border border-primary/40 rounded-full px-2 py-0.5">
                    Customisable
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="max-w-7xl mx-auto text-sm text-muted mt-12">
            {selectedCategories.size > 0
              ? "Nothing matches your filters yet."
              : "Nothing in this category yet."}
          </p>
        ) : null}

        {totalPages > 1 && (
          <nav
            className="max-w-7xl mx-auto flex max-w-full items-center justify-center gap-1.5 sm:gap-2 mt-10 md:mt-14"
            aria-label="Catalog pagination"
          >
            <Link
              to="/catalog"
              search={{ category: search.category, page: safePage > 2 ? safePage - 1 : undefined }}
              replace
              disabled={safePage === 1}
              className="grid place-items-center w-11 h-11 shrink-0 rounded-full border border-border text-muted hover:border-foreground hover:text-foreground aria-disabled:opacity-30 aria-disabled:pointer-events-none transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div className="flex min-w-0 items-center gap-1 sm:hidden">
              <PaginationItems
                items={getPaginationItems(safePage, totalPages, 0)}
                currentPage={safePage}
                category={search.category}
              />
            </div>
            <div className="hidden min-w-0 items-center gap-2 sm:flex">
              <PaginationItems
                items={getPaginationItems(safePage, totalPages, 1)}
                currentPage={safePage}
                category={search.category}
              />
            </div>
            <Link
              to="/catalog"
              search={{ category: search.category, page: safePage + 1 }}
              replace
              disabled={safePage === totalPages}
              className="grid place-items-center w-11 h-11 shrink-0 rounded-full border border-border text-muted hover:border-foreground hover:text-foreground aria-disabled:opacity-30 aria-disabled:pointer-events-none transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </nav>
        )}
      </section>

      <section className="px-5 md:px-6 pb-16 md:pb-24">
        <div className="max-w-3xl mx-auto text-center border-t border-border pt-12 md:pt-16">
          <h2 className="font-display text-2xl md:text-3xl italic mb-4">
            Don't see what you want?
          </h2>
          <p className="text-sm text-muted mb-8 leading-relaxed">
            Almost everything is made-to-order. Tell {founder} what you have in mind.
          </p>
          <a
            href={waLink(`Hi ${founder}, I'd like a custom piece — `)}
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

function PaginationItems({
  items,
  currentPage,
  category,
}: {
  items: PaginationItem[];
  currentPage: number;
  category?: Category | Category[];
}) {
  return items.map((item, index) =>
    item === "ellipsis" ? (
      <span
        key={`ellipsis-${index}`}
        className="grid h-11 w-5 shrink-0 place-items-center text-xs text-muted"
        aria-hidden="true"
      >
        …
      </span>
    ) : (
      <Link
        key={item}
        to="/catalog"
        search={{ category, page: item === 1 ? undefined : item }}
        replace
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-[11px] font-medium transition-colors ${
          item === currentPage
            ? "bg-foreground text-background"
            : "border border-border text-muted hover:border-foreground hover:text-foreground"
        }`}
        aria-label={`Page ${item}`}
        aria-current={item === currentPage ? "page" : undefined}
      >
        {item}
      </Link>
    ),
  );
}

function CategoryChip({
  active,
  onSelect,
  onRemove,
  children,
}: {
  active: boolean;
  onSelect: () => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border text-[10px] md:text-[11px] uppercase tracking-[0.18em] md:tracking-[0.2em] font-medium transition-colors",
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-background text-muted border-border",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        disabled={active}
        className={cn(
          "min-h-11 whitespace-nowrap py-2 pl-3 md:pl-4",
          active ? "pr-1 cursor-default" : "pr-3 md:pr-4 hover:text-foreground",
        )}
      >
        {children}
      </button>
      {active ? (
        <button
          type="button"
          onClick={onRemove}
          className="mr-0.5 grid h-11 w-11 place-items-center rounded-full hover:bg-background/20"
          aria-label={`Remove ${String(children)} filter`}
        >
          <X className="w-3 h-3" />
        </button>
      ) : null}
    </span>
  );
}
