import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Plus, Pencil, Trash2, Package, Search, X, Star, Eye, EyeOff } from "lucide-react";
import { useState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormErrorBanner } from "@/components/admin/AdminField";
import { listAdminCategories } from "@/lib/api/admin/categories";
import { deleteAdminProduct, listAdminProducts, toggleAdminProductActive, toggleAdminProductHomepageFeatured } from "@/lib/api/admin/products";
import { sortCategoriesWithSelectedFirst } from "@/lib/sort-categories-by-selection";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/products/")({
  loader: async () => {
    const [products, categories] = await Promise.all([listAdminProducts(), listAdminCategories()]);
    return { products, categories };
  },
  component: AdminProductsPage,
});

function AdminProductsPage() {
  const { products, categories } = Route.useLoaderData();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [featuredToggleId, setFeaturedToggleId] = useState<number | null>(null);
  const [featuredError, setFeaturedError] = useState<string | null>(null);
  const [statusToggleId, setStatusToggleId] = useState<number | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(() => new Set());

  const categoryLabels = useMemo(
    () => new Map(categories.map((category) => [category.id, category.label])),
    [categories],
  );

  const addCategoryFilter = (categoryId: string) => {
    setSelectedCategories((prev) => new Set(prev).add(categoryId));
  };

  const removeCategoryFilter = (categoryId: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      next.delete(categoryId);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return products.filter((product) => {
      if (selectedCategories.size > 0 && !selectedCategories.has(product.categoryId)) return false;
      if (!q) return true;
      return (
        product.name.toLowerCase().includes(q) ||
        product.categoryId.toLowerCase().includes(q) ||
        (categoryLabels.get(product.categoryId)?.toLowerCase().includes(q) ?? false) ||
        product.slug.toLowerCase().includes(q)
      );
    });
  }, [products, query, selectedCategories, categoryLabels]);

  const hasActiveFilters = query.trim().length > 0 || selectedCategories.size > 0;
  const featuredCount = useMemo(() => products.filter((product) => product.featuredOnHomepage).length, [products]);
  const hiddenCount = useMemo(() => products.filter((product) => !product.isActive).length, [products]);

  const sortedCategories = useMemo(
    () => sortCategoriesWithSelectedFirst(categories, selectedCategories),
    [categories, selectedCategories],
  );

  const handleToggleActive = async (id: number, active: boolean) => {
    setStatusToggleId(id);
    setStatusError(null);
    try {
      await toggleAdminProductActive({ data: { id, active } });
      await router.invalidate();
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Failed to update product status");
    } finally {
      setStatusToggleId(null);
    }
  };

  const handleToggleFeatured = async (id: number, featured: boolean) => {
    setFeaturedToggleId(id);
    setFeaturedError(null);
    try {
      await toggleAdminProductHomepageFeatured({ data: { id, featured } });
      await router.invalidate();
    } catch (err) {
      setFeaturedError(err instanceof Error ? err.message : "Failed to update homepage feature");
    } finally {
      setFeaturedToggleId(null);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    setDeleteError(null);
    try {
      await deleteAdminProduct({ data: { id } });
      await router.invalidate();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl md:text-5xl italic tracking-tight">Products</h1>
          <p className="text-sm text-muted mt-1">
            {hasActiveFilters
              ? `${filtered.length} of ${products.length} items shown`
              : `${products.length} items in catalog`}
            {featuredCount > 0 ? ` · ${featuredCount}/6 on homepage` : null}
            {hiddenCount > 0 ? ` · ${hiddenCount} hidden` : null}
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto h-11 shrink-0">
          <Link to="/admin/products/$productId" params={{ productId: "new" }}>
            <Plus className="w-4 h-4 mr-2" />
            Add product
          </Link>
        </Button>
      </div>

      {/* Search */}
      {deleteError ? <FormErrorBanner message={deleteError} /> : null}
      {featuredError ? <FormErrorBanner message={featuredError} /> : null}
      {statusError ? <FormErrorBanner message={statusError} /> : null}

      {products.length > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <Input
              placeholder="Search by name, category or slug…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-11"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
        </div>
      )}

      {/* Empty state */}
      {products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-xl">
          <Package className="w-10 h-10 text-muted mb-4" />
          <p className="font-display text-xl italic mb-1">No products yet</p>
          <p className="text-sm text-muted mb-6">Add your first product to the catalog.</p>
          <Button asChild>
            <Link to="/admin/products/$productId" params={{ productId: "new" }}>
              <Plus className="w-4 h-4 mr-2" />
              Add product
            </Link>
          </Button>
        </div>
      )}

      {/* No search results */}
      {products.length > 0 && filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-muted border border-dashed border-border rounded-xl">
          {hasActiveFilters ? "No products match your filters." : "No products found."}
        </div>
      )}

      {/* Mobile card list */}
      {filtered.length > 0 && (
        <div className="md:hidden space-y-3">
          {filtered.map((product) => (
            <article
              key={product.id}
              className={cn(
                "border border-border rounded-xl overflow-hidden bg-surface/20",
                !product.isActive && "opacity-60",
              )}
            >
              <div className="flex gap-4 p-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-surface shrink-0 border border-border">
                  {product.imagePath ? (
                    <img src={product.imagePath} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center">
                      <Package className="w-5 h-5 text-muted/40" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-medium text-sm leading-snug line-clamp-2">
                    {product.name}
                    {!product.isActive ? (
                      <span className="ml-2 inline-flex rounded-full border border-border px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted align-middle">
                        Hidden
                      </span>
                    ) : null}
                  </h2>
                  <p className="text-xs text-muted mt-1">{categoryLabels.get(product.categoryId) ?? product.categoryId}</p>
                  {product.priceFrom && (
                    <p className="text-xs font-medium text-primary mt-1">{product.priceFrom}</p>
                  )}
                  <p className="font-mono text-[10px] text-muted/70 mt-1 truncate">{product.slug}</p>
                </div>
              </div>
              <div className="flex gap-2 px-4 pb-4">
                <Button
                  variant="outline"
                  className={cn(
                    "h-10 px-3.5 shrink-0",
                    product.isActive
                      ? "text-emerald-700 border-emerald-300/60 bg-emerald-50 hover:bg-emerald-100"
                      : "text-muted hover:text-foreground hover:border-border",
                  )}
                  disabled={statusToggleId === product.id}
                  onClick={() => handleToggleActive(product.id, !product.isActive)}
                  aria-label={
                    product.isActive
                      ? `Hide ${product.name} from the public site`
                      : `Show ${product.name} on the public site`
                  }
                  title={product.isActive ? "Listed publicly" : "Hidden from site"}
                >
                  {statusToggleId === product.id ? (
                    <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                  ) : product.isActive ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "h-10 px-3.5 shrink-0",
                    product.featuredOnHomepage
                      ? "text-primary border-primary/40 bg-primary/5 hover:bg-primary/10"
                      : "text-muted hover:text-primary hover:border-primary/40",
                  )}
                  disabled={featuredToggleId === product.id || !product.isActive}
                  onClick={() => handleToggleFeatured(product.id, !product.featuredOnHomepage)}
                  aria-label={
                    product.featuredOnHomepage
                      ? `Remove ${product.name} from homepage gallery`
                      : `Feature ${product.name} on homepage gallery`
                  }
                  title={
                    !product.isActive
                      ? "Activate product to feature on homepage"
                      : product.featuredOnHomepage
                        ? "On homepage"
                        : "Add to homepage"
                  }
                >
                  {featuredToggleId === product.id ? (
                    <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Star className={cn("w-3.5 h-3.5", product.featuredOnHomepage && "fill-primary/30")} />
                  )}
                </Button>
                <Button variant="outline" className="flex-1 h-10 text-sm" asChild>
                  <Link to="/admin/products/$productId" params={{ productId: String(product.id) }}>
                    <Pencil className="w-3.5 h-3.5 mr-2" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-10 px-3.5 text-destructive hover:text-destructive hover:border-destructive/50"
                  disabled={deletingId === product.id}
                  onClick={() => handleDelete(product.id, product.name)}
                  aria-label={`Delete ${product.name}`}
                >
                  {deletingId === product.id ? (
                    <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Desktop table */}
      {filtered.length > 0 && (
        <div className="hidden md:block border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface/40 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted w-16">Image</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Name</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Category</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted hidden lg:table-cell">Slug</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted hidden lg:table-cell">Price</th>
                <th className="text-right px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((product) => (
                <tr key={product.id} className={cn("hover:bg-surface/20 transition-colors", !product.isActive && "opacity-60")}>
                  <td className="px-4 py-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface border border-border shrink-0">
                      {product.imagePath ? (
                        <img src={product.imagePath} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full grid place-items-center">
                          <Package className="w-4 h-4 text-muted/30" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium max-w-[200px]">
                    <span className="line-clamp-2 leading-snug inline-flex items-start gap-2">
                      {product.name}
                      {!product.isActive ? (
                        <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[9px] uppercase tracking-wider text-muted">
                          Hidden
                        </span>
                      ) : null}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block font-mono text-[10px] uppercase tracking-wider border border-border rounded-full px-2.5 py-0.5 text-muted">
                      {categoryLabels.get(product.categoryId) ?? product.categoryId}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted hidden lg:table-cell max-w-[160px]">
                    <span className="truncate block">{product.slug}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted hidden lg:table-cell">
                    {product.priceFrom ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "h-8 px-3",
                          product.isActive
                            ? "text-emerald-700 border-emerald-300/60 bg-emerald-50 hover:bg-emerald-100"
                            : "text-muted hover:text-foreground hover:border-border",
                        )}
                        disabled={statusToggleId === product.id}
                        onClick={() => handleToggleActive(product.id, !product.isActive)}
                        aria-label={
                          product.isActive
                            ? `Hide ${product.name} from the public site`
                            : `Show ${product.name} on the public site`
                        }
                        title={product.isActive ? "Listed publicly" : "Hidden from site"}
                      >
                        {statusToggleId === product.id ? (
                          <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        ) : product.isActive ? (
                          <Eye className="w-3 h-3" />
                        ) : (
                          <EyeOff className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "h-8 px-3",
                          product.featuredOnHomepage
                            ? "text-primary border-primary/40 bg-primary/5 hover:bg-primary/10"
                            : "text-muted hover:text-primary hover:border-primary/40",
                        )}
                        disabled={featuredToggleId === product.id || !product.isActive}
                        onClick={() => handleToggleFeatured(product.id, !product.featuredOnHomepage)}
                        aria-label={
                          product.featuredOnHomepage
                            ? `Remove ${product.name} from homepage gallery`
                            : `Feature ${product.name} on homepage gallery`
                        }
                        title={
                          !product.isActive
                            ? "Activate product to feature on homepage"
                            : product.featuredOnHomepage
                              ? "On homepage"
                              : "Add to homepage"
                        }
                      >
                        {featuredToggleId === product.id ? (
                          <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Star className={cn("w-3 h-3", product.featuredOnHomepage && "fill-primary/30")} />
                        )}
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 px-3 gap-1.5" asChild>
                        <Link to="/admin/products/$productId" params={{ productId: String(product.id) }}>
                          <Pencil className="w-3 h-3" />
                          Edit
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-destructive hover:text-destructive hover:border-destructive/50"
                        disabled={deletingId === product.id}
                        onClick={() => handleDelete(product.id, product.name)}
                        aria-label={`Delete ${product.name}`}
                      >
                        {deletingId === product.id ? (
                          <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
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
        "inline-flex shrink-0 items-center rounded-full border text-[10px] uppercase tracking-[0.18em] font-medium transition-colors",
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
          "whitespace-nowrap py-2 pl-3",
          active ? "pr-1 cursor-default" : "pr-3 hover:text-foreground hover:border-foreground",
        )}
      >
        {children}
      </button>
      {active ? (
        <button
          type="button"
          onClick={onRemove}
          className="mr-1.5 grid h-5 w-5 place-items-center rounded-full hover:bg-background/20"
          aria-label={`Remove ${String(children)} filter`}
        >
          <X className="w-3 h-3" />
        </button>
      ) : null}
    </span>
  );
}
