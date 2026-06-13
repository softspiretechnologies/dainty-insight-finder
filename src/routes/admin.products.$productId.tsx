import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ImagePlus, ChevronLeft, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BulletTextarea } from "@/components/ui/bullet-textarea";
import { getAdminProduct, saveAdminProduct } from "@/lib/api/admin/products";
import { listAdminCategories } from "@/lib/api/admin/categories";
import { fileToUploadPayload } from "@/lib/admin-upload-payload";
import { normalizeProductDetails } from "@/lib/product-details";
import type { CategoryId } from "@/types/catalog";

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

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted border-b border-border pb-2">{title}</p>
      {children}
    </div>
  );
}

function AdminProductEditPage() {
  const { product, categories } = Route.useLoaderData();
  const { productId } = Route.useParams();
  const router = useRouter();
  const isNew = productId === "new";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "hampers");
  const [blurb, setBlurb] = useState(product?.blurb ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [details, setDetails] = useState(normalizeProductDetails(product?.details).join("\n"));
  const [priceFrom, setPriceFrom] = useState(product?.priceFrom ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const slug = slugify(name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await saveAdminProduct({
        data: {
          id: isNew ? "new" : product!.id,
          name,
          slug,
          categoryId: categoryId as CategoryId,
          blurb,
          description,
          details,
          priceFrom: priceFrom || undefined,
          existingImagePath: product?.imagePath,
          image: imageFile ? await fileToUploadPayload(imageFile) : undefined,
        },
      });
      await router.navigate({ to: "/admin/products" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
      setLoading(false);
    }
  };

  const previewSrc = previewUrl ?? product?.imagePath ?? null;

  return (
    <div className="max-w-5xl">
      {/* Back + title */}
      <Link
        to="/admin/products"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground mb-5 transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Products
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 md:mb-8">
        <h1 className="font-display text-3xl md:text-5xl italic tracking-tight">
          {isNew ? "New product" : "Edit product"}
        </h1>
        {!isNew && slug && (
          <a
            href={`/catalog/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-medium border border-border rounded-full px-4 py-2 hover:border-foreground transition-colors shrink-0"
          >
            View on site ↗
          </a>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Desktop 2-column layout */}
        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8 space-y-6 lg:space-y-0">

          {/* Left column — fields */}
          <div className="space-y-8">

            <FormSection title="Basic info">
              <div className="space-y-2">
                <Label htmlFor="name">Product name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Garden Meadow Bouquet"
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  readOnly
                  disabled
                  placeholder="Generated from product name"
                  className="h-11 font-mono text-sm bg-muted/30 cursor-not-allowed"
                />
                <p className="text-xs text-muted">
                  Auto-generated from name · /catalog/{slug || "your-slug"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Category</Label>
                  <select
                    id="categoryId"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceFrom">Price from</Label>
                  <Input
                    id="priceFrom"
                    value={priceFrom}
                    onChange={(e) => setPriceFrom(e.target.value)}
                    placeholder="₹1,200"
                    className="h-11"
                  />
                </div>
              </div>
            </FormSection>

            <FormSection title="Content">
              <div className="space-y-2">
                <Label htmlFor="blurb">Short blurb</Label>
                <Input
                  id="blurb"
                  value={blurb}
                  onChange={(e) => setBlurb(e.target.value)}
                  placeholder="One-line description shown on catalog cards"
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Full description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description shown on the product page"
                  rows={4}
                  required
                  className="resize-y min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="details">Details</Label>
                <BulletTextarea
                  id="details"
                  value={details}
                  onChange={setDetails}
                  placeholder={"• 600gsm cotton paper\n• Envelope, RSVP & details card\n• Silk ribbon closure"}
                  rows={5}
                  required
                  className="resize-y min-h-[140px]"
                />
                <p className="text-xs text-muted">Press Enter for a new bullet — shown as a specs list on the product page.</p>
              </div>
            </FormSection>

          </div>

          {/* Right column — image */}
          <div className="space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted border-b border-border pb-2">Product image</p>

            {/* Preview */}
            <div
              className="aspect-[4/5] rounded-xl border border-dashed border-border overflow-hidden bg-surface cursor-pointer hover:border-foreground/40 transition-colors relative group"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              aria-label="Upload product image"
            >
              {previewSrc ? (
                <>
                  <img src={previewSrc} alt="Product preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="text-white text-center">
                      <ImagePlus className="w-7 h-7 mx-auto mb-1" />
                      <p className="text-xs font-medium">Replace image</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted p-4 text-center">
                  <Package className="w-10 h-10 text-muted/30" />
                  <ImagePlus className="w-5 h-5" />
                  <p className="text-sm font-medium">Upload image</p>
                  <p className="text-xs text-muted">JPEG, PNG or WebP · max 5 MB</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                setImageFile(e.target.files?.[0] ?? null);
              }}
              required={isNew && !product?.imagePath}
            />

            <Button
              type="button"
              variant="outline"
              className="w-full h-11"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="w-4 h-4 mr-2" />
              {imageFile ? imageFile.name : previewSrc ? "Replace image" : "Choose image"}
            </Button>

            {imageFile && (
              <p className="text-xs text-muted text-center truncate">{imageFile.name}</p>
            )}
            {!isNew && !imageFile && (
              <p className="text-xs text-muted text-center">Leave unchanged to keep current image.</p>
            )}
          </div>
        </div>

        {/* Footer — error + submit */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {error && (
            <p className="text-sm text-destructive flex-1">{error}</p>
          )}
          <div className="flex gap-3 w-full sm:w-auto sm:ml-auto">
            <Button type="button" variant="outline" className="flex-1 sm:flex-none h-11" asChild>
              <Link to="/admin/products">Cancel</Link>
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 sm:flex-none h-11 min-w-[140px]">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Saving…
                </span>
              ) : isNew ? "Create product" : "Save changes"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
