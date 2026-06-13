import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Plus, Pencil, Trash2, Package, Search } from "lucide-react";
import { useState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormErrorBanner } from "@/components/admin/AdminField";
import { deleteAdminProduct, listAdminProducts } from "@/lib/api/admin/products";

export const Route = createFileRoute("/admin/products/")({
  loader: async () => {
    const products = await listAdminProducts();
    return { products };
  },
  component: AdminProductsPage,
});

function AdminProductsPage() {
  const { products } = Route.useLoaderData();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.categoryId.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q),
    );
  }, [products, query]);

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
          <p className="text-sm text-muted mt-1">{products.length} items in catalog</p>
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

      {products.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <Input
            placeholder="Search by name, category or slug…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-11"
          />
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
          No products match "{query}"
        </div>
      )}

      {/* Mobile card list */}
      {filtered.length > 0 && (
        <div className="md:hidden space-y-3">
          {filtered.map((product) => (
            <article key={product.id} className="border border-border rounded-xl overflow-hidden bg-surface/20">
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
                  <h2 className="font-medium text-sm leading-snug line-clamp-2">{product.name}</h2>
                  <p className="text-xs text-muted mt-1 capitalize">{product.categoryId}</p>
                  {product.priceFrom && (
                    <p className="text-xs font-medium text-primary mt-1">{product.priceFrom}</p>
                  )}
                  <p className="font-mono text-[10px] text-muted/70 mt-1 truncate">{product.slug}</p>
                </div>
              </div>
              <div className="flex gap-2 px-4 pb-4">
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
                <tr key={product.id} className="hover:bg-surface/20 transition-colors">
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
                    <span className="line-clamp-2 leading-snug">{product.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block font-mono text-[10px] uppercase tracking-wider border border-border rounded-full px-2.5 py-0.5 text-muted">
                      {product.categoryId}
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
