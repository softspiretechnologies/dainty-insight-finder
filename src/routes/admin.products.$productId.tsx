import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ImagePlus, ChevronLeft, Package, Eye, EyeOff, Star } from "lucide-react";

import { AdminField, FormErrorBanner } from "@/components/admin/AdminField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BulletTextarea } from "@/components/ui/bullet-textarea";
import { adminProductFormSchema } from "@/lib/admin-schemas";
import { invalidInputClass, scrollToFirstField, validateForm, type FieldErrors } from "@/lib/admin-validation";
import { getAdminProduct, saveAdminProduct } from "@/lib/api/admin/products";
import { listAdminCategories } from "@/lib/api/admin/categories";
import { fileToUploadPayload } from "@/lib/admin-upload-payload";
import { normalizeProductDetails } from "@/lib/product-details";
import { cn } from "@/lib/utils";
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
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [featuredOnHomepage, setFeaturedOnHomepage] = useState(product?.featuredOnHomepage ?? false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
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
  const previewSrc = previewUrl ?? product?.imagePath ?? null;

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const payload = {
      name,
      slug,
      categoryId: categoryId as CategoryId,
      blurb,
      description,
      details,
      priceFrom: priceFrom || undefined,
      isActive,
      featuredOnHomepage: isActive ? featuredOnHomepage : false,
    };

    const validation = validateForm(adminProductFormSchema, payload);
    const errors = validation.ok ? {} : { ...validation.errors };

    if (!previewSrc) {
      errors.image = "Product image is required";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      scrollToFirstField(errors);
      return;
    }

    if (!validation.ok) return;

    setFieldErrors({});
    setLoading(true);

    try {
      let imagePayload;
      if (imageFile) {
        imagePayload = await fileToUploadPayload(imageFile);
      }

      await saveAdminProduct({
        data: {
          id: isNew ? "new" : product!.id,
          ...validation.data,
          priceFrom: validation.data.priceFrom || undefined,
          isActive: validation.data.isActive,
          featuredOnHomepage: validation.data.featuredOnHomepage,
          existingImagePath: product?.imagePath,
          image: imagePayload,
        },
      });
      await router.navigate({ to: "/admin/products" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save product";
      if (/slug already exists/i.test(message)) {
        setFieldErrors({ name: message });
        scrollToFirstField({ name: message });
      } else {
        setFormError(message);
      }
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl">
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
        {!isNew && slug && isActive ? (
          <a
            href={`/catalog/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-medium border border-border rounded-full px-4 py-2 hover:border-foreground transition-colors shrink-0"
          >
            View on site ↗
          </a>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8 space-y-6 lg:space-y-0">
          <div className="space-y-8">
            <FormSection title="Basic info">
              <AdminField label="Product name" htmlFor="name" required error={fieldErrors.name}>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearFieldError("name");
                  }}
                  placeholder="e.g. Garden Meadow Bouquet"
                  className={`h-11 ${invalidInputClass(fieldErrors.name)}`}
                />
              </AdminField>

              <AdminField
                label="URL slug"
                htmlFor="slug"
                hint={`Auto-generated from name · /catalog/${slug || "your-slug"}`}
              >
                <Input
                  id="slug"
                  value={slug}
                  readOnly
                  disabled
                  className="h-11 font-mono text-sm bg-muted/30 cursor-not-allowed"
                />
              </AdminField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AdminField label="Category" htmlFor="categoryId" required error={fieldErrors.categoryId}>
                  <select
                    id="categoryId"
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                      clearFieldError("categoryId");
                    }}
                    className={cn(
                      "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      invalidInputClass(fieldErrors.categoryId),
                    )}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </AdminField>

                <AdminField label="Price from" htmlFor="priceFrom" error={fieldErrors.priceFrom}>
                  <Input
                    id="priceFrom"
                    value={priceFrom}
                    onChange={(e) => {
                      setPriceFrom(e.target.value);
                      clearFieldError("priceFrom");
                    }}
                    placeholder="₹1,200"
                    className={`h-11 ${invalidInputClass(fieldErrors.priceFrom)}`}
                  />
                </AdminField>
              </div>
            </FormSection>

            <FormSection title="Content">
              <AdminField label="Short blurb" htmlFor="blurb" required error={fieldErrors.blurb}>
                <Input
                  id="blurb"
                  value={blurb}
                  onChange={(e) => {
                    setBlurb(e.target.value);
                    clearFieldError("blurb");
                  }}
                  placeholder="One-line description shown on catalog cards"
                  className={`h-11 ${invalidInputClass(fieldErrors.blurb)}`}
                />
              </AdminField>

              <AdminField label="Full description" htmlFor="description" required error={fieldErrors.description}>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    clearFieldError("description");
                  }}
                  placeholder="Detailed description shown on the product page"
                  rows={4}
                  className={cn("resize-y min-h-[120px]", invalidInputClass(fieldErrors.description))}
                />
              </AdminField>

              <AdminField
                label="Details"
                htmlFor="details"
                required
                error={fieldErrors.details}
                hint="Press Enter for a new bullet — shown as a specs list on the product page."
              >
                <BulletTextarea
                  id="details"
                  value={details}
                  onChange={(value) => {
                    setDetails(value);
                    clearFieldError("details");
                  }}
                  placeholder={"• 600gsm cotton paper\n• Envelope, RSVP & details card\n• Silk ribbon closure"}
                  rows={5}
                  className={cn("resize-y min-h-[140px]", invalidInputClass(fieldErrors.details))}
                />
              </AdminField>
            </FormSection>
          </div>

          <div className="space-y-4" id="field-image">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted border-b border-border pb-2">
              Product image<span className="text-destructive ml-0.5">*</span>
            </p>

            <div
              className={cn(
                "aspect-4/5 rounded-xl border border-dashed overflow-hidden bg-surface cursor-pointer hover:border-foreground/40 transition-colors relative group",
                fieldErrors.image ? "border-destructive ring-1 ring-destructive" : "border-border",
              )}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              aria-label="Upload product image"
              aria-invalid={fieldErrors.image ? true : undefined}
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
                clearFieldError("image");
              }}
            />

            <Button type="button" variant="outline" className="w-full h-11" onClick={() => fileInputRef.current?.click()}>
              <ImagePlus className="w-4 h-4 mr-2" />
              {imageFile ? imageFile.name : previewSrc ? "Replace image" : "Choose image"}
            </Button>

            {fieldErrors.image ? (
              <p className="text-sm text-destructive" role="alert">
                {fieldErrors.image}
              </p>
            ) : null}

            {!isNew && !imageFile && !fieldErrors.image ? (
              <p className="text-xs text-muted text-center">Leave unchanged to keep current image.</p>
            ) : null}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">Visibility & homepage</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer hover:border-foreground/30 transition-colors">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => {
                  const active = e.target.checked;
                  setIsActive(active);
                  if (!active) setFeaturedOnHomepage(false);
                }}
                className="mt-1 h-4 w-4 shrink-0 accent-foreground"
              />
              <span className="min-w-0">
                <span className="inline-flex items-center gap-2 text-sm font-medium">
                  {isActive ? (
                    <Eye className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-muted" />
                  )}
                  Listed on site
                </span>
                <span className="block text-xs text-muted mt-1 leading-relaxed">
                  When off, the product is hidden from the catalog, product pages, and sitemap.
                </span>
              </span>
            </label>

            <label
              className={cn(
                "flex items-start gap-3 rounded-xl border border-border p-4 transition-colors",
                isActive ? "cursor-pointer hover:border-foreground/30" : "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type="checkbox"
                checked={featuredOnHomepage}
                disabled={!isActive}
                onChange={(e) => setFeaturedOnHomepage(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-foreground disabled:cursor-not-allowed"
              />
              <span className="min-w-0">
                <span className="inline-flex items-center gap-2 text-sm font-medium">
                  <Star className={cn("w-4 h-4", featuredOnHomepage ? "text-primary fill-primary/30" : "text-muted")} />
                  Homepage gallery
                </span>
                <span className="block text-xs text-muted mt-1 leading-relaxed">
                  Show in Recent Creations on the homepage. Up to 6 products at a time.
                </span>
              </span>
            </label>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border flex flex-col gap-3">
          {formError ? <FormErrorBanner message={formError} /> : null}
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
              ) : isNew ? (
                "Create product"
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
