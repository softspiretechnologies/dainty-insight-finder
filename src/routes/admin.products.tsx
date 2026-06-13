import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteAdminProduct, listAdminProducts } from "@/lib/api/admin/products";

export const Route = createFileRoute("/admin/products")({
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

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    setDeletingId(id);
    try {
      await deleteAdminProduct({ data: { id } });
      await router.invalidate();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-4xl italic tracking-tight">Products</h1>
          <p className="text-sm text-muted mt-1">{products.length} items in catalog</p>
        </div>
        <Button asChild className="w-full sm:w-auto h-11">
          <Link to="/admin/products/$productId" params={{ productId: "new" }}>
            <Plus className="w-4 h-4 mr-2" />
            Add product
          </Link>
        </Button>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {products.map((product) => (
          <article key={product.id} className="border border-border rounded-lg p-4 bg-surface/20">
            <div className="flex gap-3">
              {product.imagePath ? (
                <img src={product.imagePath} alt="" className="w-16 h-16 object-cover rounded shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded bg-surface shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <h2 className="font-medium text-sm leading-snug">{product.name}</h2>
                <p className="text-xs text-muted mt-1 capitalize">{product.categoryId}</p>
                <p className="font-mono text-[10px] text-muted mt-1 truncate">{product.slug}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1 h-11" asChild>
                <Link to="/admin/products/$productId" params={{ productId: String(product.id) }}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-11 px-4"
                disabled={deletingId === product.id}
                onClick={() => handleDelete(product.id, product.name)}
                aria-label={`Delete ${product.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </article>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  {product.imagePath ? (
                    <img src={product.imagePath} alt="" className="w-12 h-12 object-cover rounded" />
                  ) : null}
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-muted">{product.categoryId}</TableCell>
                <TableCell className="font-mono text-xs">{product.slug}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/admin/products/$productId" params={{ productId: String(product.id) }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deletingId === product.id}
                      onClick={() => handleDelete(product.id, product.name)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
