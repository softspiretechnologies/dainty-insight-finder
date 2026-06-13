import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAdminProduct, saveAdminProduct } from "@/lib/api/admin/products";
import { listAdminCategories } from "@/lib/api/admin/categories";

export const Route = createFileRoute("/admin/products/$productId")({
  loader: async ({ params }) => {
    const categories = await listAdminCategories();
    if (params.productId === "new") {
      return { product: null, categories };
    }

    const product = await getAdminProduct({ data: { id: Number(params.productId) } });
    return { product, categories };
  },
  component: AdminProductEditPage,
});

function AdminProductEditPage() {
  const { product, categories } = Route.useLoaderData();
  const { productId } = Route.useParams();
  const router = useRouter();
  const isNew = productId === "new";

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "hampers");
  const [blurb, setBlurb] = useState(product?.blurb ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [details, setDetails] = useState((product?.details ?? []).join("\n"));
  const [priceFrom, setPriceFrom] = useState(product?.priceFrom ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("id", isNew ? "new" : String(product!.id));
    formData.set("name", name);
    formData.set("slug", slug);
    formData.set("categoryId", categoryId);
    formData.set("blurb", blurb);
    formData.set("description", description);
    formData.set("details", details);
    formData.set("priceFrom", priceFrom);
    if (product?.imagePath) formData.set("existingImagePath", product.imagePath);
    if (imageFile) formData.set("image", imageFile);

    try {
      await saveAdminProduct({ data: formData });
      await router.navigate({ to: "/admin/products" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const previewSrc = imageFile ? URL.createObjectURL(imageFile) : product?.imagePath;

  return (
    <div className="max-w-2xl">
      <Link to="/admin/products" className="text-xs text-muted hover:text-foreground">
        ← Back to products
      </Link>
      <h1 className="font-display text-2xl md:text-4xl italic tracking-tight mt-4 mb-6 md:mb-8">
        {isNew ? "Add product" : "Edit product"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="h-11" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required className="h-11" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">Category</Label>
          <select
            id="categoryId"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="blurb">Short blurb</Label>
          <Input id="blurb" value={blurb} onChange={(e) => setBlurb(e.target.value)} required className="h-11" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="details">Details (one per line)</Label>
          <Textarea id="details" value={details} onChange={(e) => setDetails(e.target.value)} rows={5} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="priceFrom">Price from (optional)</Label>
          <Input id="priceFrom" value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)} placeholder="₹1,200" className="h-11" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">Product image</Label>
          {previewSrc ? (
            <img src={previewSrc} alt="Preview" className="w-32 h-32 object-cover rounded border border-border mb-2" />
          ) : null}
          <Input
            id="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            required={isNew && !product?.imagePath}
          />
          {!isNew ? <p className="text-xs text-muted">Leave empty to keep the current image.</p> : null}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" disabled={loading} className="w-full sm:w-auto h-11">
          {loading ? "Saving…" : isNew ? "Create product" : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
