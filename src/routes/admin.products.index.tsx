import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Search,
  X,
  Star,
  Eye,
  EyeOff,
  MoreHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { AdminActionError } from "@/components/admin/AdminActionError";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminPagePending } from "@/components/admin/AdminSkeleton";
import { AdminSaveStatus } from "@/components/admin/AdminSaveStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { listAdminCategories } from "@/lib/api/admin/categories";
import {
  deleteAdminProduct,
  listAdminProducts,
  toggleAdminProductActive,
  toggleAdminProductHomepageFeatured,
} from "@/lib/api/admin/products";
import {
  adminProductSearchHasFilters,
  adminProductSearchSchema,
  buildAdminProductSearch,
  categoriesFromSearch,
  clearAdminProductSearch,
  statusFromSearch,
  type AdminProductStatusFilter,
} from "@/lib/admin-product-search";
import { sortCategoriesWithSelectedFirst } from "@/lib/sort-categories-by-selection";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/products/")({
  validateSearch: adminProductSearchSchema,
  loader: async () => {
    const [products, categories] = await Promise.all([listAdminProducts(), listAdminCategories()]);
    return { products, categories };
  },
  pendingComponent: AdminPagePending,
  component: AdminProductsPage,
});

const STATUS_FILTERS: Array<{ id: AdminProductStatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "active", label: "Visible" },
  { id: "hidden", label: "Hidden" },
  { id: "featured", label: "Homepage" },
];

function AdminProductsPage() {
  const { products, categories } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [featuredToggleId, setFeaturedToggleId] = useState<number | null>(null);
  const [featuredError, setFeaturedError] = useState<string | null>(null);
  const [statusToggleId, setStatusToggleId] = useState<number | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [query, setQuery] = useState(search.q ?? "");
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [productActionTarget, setProductActionTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const moreTriggerRef = useRef<HTMLButtonElement | null>(null);
  const savedMessageTimerRef = useRef<number | null>(null);

  const statusFilter = statusFromSearch(search.status);
  const selectedCategories = useMemo(
    () => categoriesFromSearch(search.categories),
    [search.categories],
  );

  useEffect(() => {
    setQuery(search.q ?? "");
  }, [search.q]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = query.trim();
      const current = (search.q ?? "").trim();
      if (next === current) return;
      void navigate({
        search: (prev) =>
          buildAdminProductSearch({
            q: next,
            status: statusFromSearch(prev.status),
            categories: categoriesFromSearch(prev.categories),
          }),
        replace: true,
      });
    }, 350);
    return () => window.clearTimeout(handle);
  }, [navigate, query, search.q]);

  useEffect(() => {
    return () => {
      if (savedMessageTimerRef.current !== null) {
        window.clearTimeout(savedMessageTimerRef.current);
      }
    };
  }, []);

  const showSavedMessage = (message: string) => {
    setSavedMessage(message);
    if (savedMessageTimerRef.current !== null) {
      window.clearTimeout(savedMessageTimerRef.current);
    }
    savedMessageTimerRef.current = window.setTimeout(() => {
      setSavedMessage(null);
      savedMessageTimerRef.current = null;
    }, 2500);
  };

  const setStatusFilter = (status: AdminProductStatusFilter) => {
    void navigate({
      search: (prev) =>
        buildAdminProductSearch({
          q: prev.q,
          status,
          categories: categoriesFromSearch(prev.categories),
        }),
    });
  };

  const addCategoryFilter = (categoryId: string) => {
    void navigate({
      search: (prev) => {
        const next = new Set(categoriesFromSearch(prev.categories));
        next.add(categoryId);
        return buildAdminProductSearch({
          q: prev.q,
          status: statusFromSearch(prev.status),
          categories: next,
        });
      },
    });
  };

  const removeCategoryFilter = (categoryId: string) => {
    void navigate({
      search: (prev) => {
        const next = new Set(categoriesFromSearch(prev.categories));
        next.delete(categoryId);
        return buildAdminProductSearch({
          q: prev.q,
          status: statusFromSearch(prev.status),
          categories: next,
        });
      },
    });
  };

  const clearSearch = () => {
    setQuery("");
    void navigate({
      search: (prev) =>
        buildAdminProductSearch({
          q: undefined,
          status: statusFromSearch(prev.status),
          categories: categoriesFromSearch(prev.categories),
        }),
      replace: true,
    });
  };

  const clearFilters = () => {
    setQuery("");
    void navigate({ search: clearAdminProductSearch() });
  };

  const categoryLabels = useMemo(
    () => new Map(categories.map((category) => [category.id, category.label])),
    [categories],
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return products.filter((product) => {
      if (statusFilter === "active" && !product.isActive) return false;
      if (statusFilter === "hidden" && product.isActive) return false;
      if (statusFilter === "featured" && !product.featuredOnHomepage) return false;
      if (selectedCategories.size > 0 && !selectedCategories.has(product.categoryId)) return false;
      if (!q) return true;
      return (
        product.name.toLowerCase().includes(q) ||
        product.categoryId.toLowerCase().includes(q) ||
        (categoryLabels.get(product.categoryId)?.toLowerCase().includes(q) ?? false) ||
        product.slug.toLowerCase().includes(q)
      );
    });
  }, [products, query, statusFilter, selectedCategories, categoryLabels]);

  const hasActiveFilters = adminProductSearchHasFilters(search) || query.trim().length > 0;
  const featuredCount = useMemo(
    () => products.filter((product) => product.featuredOnHomepage).length,
    [products],
  );
  const hiddenCount = useMemo(
    () => products.filter((product) => !product.isActive).length,
    [products],
  );

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
      showSavedMessage(active ? "Now visible on the site" : "Hidden from the site");
    } catch {
      setStatusError("Couldn't update visibility. Try again.");
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
      showSavedMessage(featured ? "Added to homepage" : "Removed from homepage");
    } catch {
      setFeaturedError("Couldn't update homepage feature. Try again.");
    } finally {
      setFeaturedToggleId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    setDeleteError(null);
    try {
      await deleteAdminProduct({ data: { id: deleteTarget.id } });
      setDeleteTarget(null);
      await router.invalidate();
    } catch {
      setDeleteError("Couldn't delete this product. Try again.");
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

      {deleteError ? <AdminActionError message={deleteError} /> : null}
      {featuredError ? <AdminActionError message={featuredError} /> : null}
      {statusError ? <AdminActionError message={statusError} /> : null}
      <AdminSaveStatus message={savedMessage} />

      {products.length > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <Input
              placeholder="Search by name or category…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-11 h-11"
              aria-label="Search products"
            />
            {query ? (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-md text-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 scrollbar-none">
            {STATUS_FILTERS.map((option) => (
              <FilterChip
                key={option.id}
                active={statusFilter === option.id}
                onSelect={() => setStatusFilter(option.id)}
              >
                {option.label}
              </FilterChip>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 scrollbar-none">
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
          <p>{hasActiveFilters ? "No products match your filters." : "No products found."}</p>
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              className="mt-4 min-h-11"
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      )}

      {/* Mobile card list */}
      {filtered.length > 0 && (
        <div className="xl:hidden space-y-3" data-testid="product-card-list">
          {filtered.map((product) => (
            <article
              key={product.id}
              className={cn(
                "border border-border rounded-xl overflow-hidden bg-surface/20",
                !product.isActive && "bg-surface/50",
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
                  <p className="text-xs text-muted mt-1">
                    {categoryLabels.get(product.categoryId) ?? product.categoryId}
                  </p>
                  {product.priceFrom && (
                    <p className="text-xs font-medium text-primary mt-1">{product.priceFrom}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 px-4 pb-4">
                <Button
                  variant="outline"
                  className={cn(
                    "h-11 w-full gap-1.5 px-3 text-xs",
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
                >
                  {statusToggleId === product.id ? (
                    <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                  ) : product.isActive ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                  Visible
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "h-11 w-full gap-1.5 px-3 text-xs",
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
                >
                  {featuredToggleId === product.id ? (
                    <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Star
                      className={cn("w-3.5 h-3.5", product.featuredOnHomepage && "fill-primary/30")}
                    />
                  )}
                  Homepage
                </Button>
                <Button variant="outline" className="h-11 w-full text-sm" asChild>
                  <Link to="/admin/products/$productId" params={{ productId: String(product.id) }}>
                    <Pencil className="w-3.5 h-3.5 mr-2" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-11 w-full min-w-11 px-3"
                  aria-label={`More actions for ${product.name}`}
                  aria-haspopup="dialog"
                  aria-expanded={productActionTarget?.id === product.id}
                  onClick={(event) => {
                    moreTriggerRef.current = event.currentTarget;
                    setProductActionTarget({ id: product.id, name: product.name });
                  }}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Desktop table */}
      {filtered.length > 0 && (
        <div
          className="hidden xl:block max-w-full overflow-x-auto border border-border rounded-xl"
          data-testid="product-table"
        >
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-surface/40 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted w-16">
                  Image
                </th>
                <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                  Name
                </th>
                <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                  Category
                </th>
                <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted hidden lg:table-cell">
                  Price
                </th>
                <th className="text-right px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((product) => (
                <tr
                  key={product.id}
                  className={cn(
                    "hover:bg-surface/20 transition-colors",
                    !product.isActive && "bg-surface/50",
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface border border-border shrink-0">
                      {product.imagePath ? (
                        <img
                          src={product.imagePath}
                          alt=""
                          className="w-full h-full object-cover"
                        />
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
                    <span className="inline-block text-xs border border-border rounded-full px-2.5 py-0.5 text-muted">
                      {categoryLabels.get(product.categoryId) ?? product.categoryId}
                    </span>
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
                        onClick={() =>
                          handleToggleFeatured(product.id, !product.featuredOnHomepage)
                        }
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
                          <Star
                            className={cn(
                              "w-3 h-3",
                              product.featuredOnHomepage && "fill-primary/30",
                            )}
                          />
                        )}
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 px-3 gap-1.5" asChild>
                        <Link
                          to="/admin/products/$productId"
                          params={{ productId: String(product.id) }}
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-destructive hover:text-destructive hover:border-destructive/50"
                        disabled={deletingId === product.id}
                        onClick={() => setDeleteTarget({ id: product.id, name: product.name })}
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

      <Sheet
        open={Boolean(productActionTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setProductActionTarget(null);
            requestAnimationFrame(() => moreTriggerRef.current?.focus());
          }
        }}
      >
        <SheetContent side="bottom" className="mx-auto w-full max-w-lg rounded-t-2xl">
          <SheetHeader className="text-left mb-4 pr-10">
            <SheetTitle className="font-display italic font-normal text-2xl">
              Product actions
            </SheetTitle>
            <SheetDescription className="text-sm text-muted truncate">
              {productActionTarget?.name ?? "Product"}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full justify-start gap-2 border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
              onClick={() => {
                if (!productActionTarget) return;
                const target = productActionTarget;
                setProductActionTarget(null);
                setDeleteTarget(target);
              }}
            >
              <Trash2 className="w-4 h-4" />
              Delete product
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full"
              onClick={() => setProductActionTarget(null)}
            >
              Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && deletingId === null) setDeleteTarget(null);
        }}
        title={deleteTarget ? `Delete "${deleteTarget.name}"?` : "Delete product?"}
        description="This product will be permanently removed."
        confirmLabel="Delete product"
        cancelLabel="Cancel"
        destructive
        loading={deletingId !== null}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function FilterChip({
  active,
  onSelect,
  children,
}: {
  active: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center rounded-full border px-3 py-2 text-[10px] uppercase tracking-[0.18em] font-medium transition-colors whitespace-nowrap",
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-background text-muted border-border hover:text-foreground hover:border-foreground",
      )}
    >
      {children}
    </button>
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
          "min-h-11 whitespace-nowrap py-2 pl-3",
          active ? "pr-1 cursor-default" : "pr-3 hover:text-foreground hover:border-foreground",
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
