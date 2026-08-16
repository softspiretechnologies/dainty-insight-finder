import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Layers, Trash2, Upload } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { AdminActionError } from "@/components/admin/AdminActionError";
import { AdminField } from "@/components/admin/AdminField";
import { AdminPagePending } from "@/components/admin/AdminSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { listAdminCategories } from "@/lib/api/admin/categories";
import { bulkCreateAdminProducts } from "@/lib/api/admin/products";
import {
  MAX_BULK_QUICK_PRODUCTS,
  bulkProductQuickCreateSchema,
  type ImageUploadPayload,
  categoryIds,
} from "@/lib/admin-schemas";
import { fileToUploadPayload } from "@/lib/admin-upload-payload";
import { isValidProductPriceInput } from "@/lib/product-price";
import { cn } from "@/lib/utils";
import type { CategoryId } from "@/types/catalog";

export const Route = createFileRoute("/admin/products/bulk")({
  loader: async () => {
    const categories = await listAdminCategories();
    return { categories };
  },
  pendingComponent: AdminPagePending,
  component: AdminProductsBulkPage,
});

type BulkDraftItem = {
  localId: string;
  previewUrl: string;
  name: string;
  categoryId: string;
  priceFrom: string;
  image: ImageUploadPayload | null;
  error?: string;
};

function AdminProductsBulkPage() {
  const { categories } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<BulkDraftItem[]>([]);
  const [batchCategory, setBatchCategory] = useState(categories[0]?.id ?? "hampers");
  const [batchPrice, setBatchPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const dirty = items.length > 0 && successCount === null;
  useUnsavedChangesGuard(dirty && !busy);

  useEffect(() => {
    return () => {
      for (const item of items) {
        URL.revokeObjectURL(item.previewUrl);
      }
    };
    // Only revoke on unmount for current snapshots; items cleaned on remove/reset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const defaultCategory = useMemo(() => categories[0]?.id ?? categoryIds[0], [categories]);

  const updateItem = (localId: string, patch: Partial<BulkDraftItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.localId === localId ? { ...item, ...patch } : item)),
    );
  };

  const removeItem = (localId: string) => {
    setItems((prev) => {
      const target = prev.find((item) => item.localId === localId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.localId !== localId);
    });
  };

  const resetDrafts = () => {
    for (const item of items) URL.revokeObjectURL(item.previewUrl);
    setItems([]);
    setSuccessCount(null);
    setError(null);
    setProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setError(null);
    setSuccessCount(null);

    const incoming = Array.from(fileList);
    if (items.length + incoming.length > MAX_BULK_QUICK_PRODUCTS) {
      setError(
        `You can add up to ${MAX_BULK_QUICK_PRODUCTS} products at a time. Remove some items or split into smaller batches.`,
      );
      return;
    }

    setProgress("Preparing images…");
    try {
      const nextItems: BulkDraftItem[] = [];
      for (const file of incoming) {
        const payload = await fileToUploadPayload(file);
        const previewUrl = URL.createObjectURL(file);
        const baseName = file.name
          .replace(/\.[^.]+$/, "")
          .replace(/[_-]+/g, " ")
          .trim();
        nextItems.push({
          localId: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          previewUrl,
          name: baseName || "New product",
          categoryId: batchCategory || defaultCategory,
          priceFrom: batchPrice,
          image: payload,
        });
      }
      setItems((prev) => [...prev, ...nextItems]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read one of the selected images.");
    } finally {
      setProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const applyCategoryToAll = () => {
    setItems((prev) => prev.map((item) => ({ ...item, categoryId: batchCategory })));
  };

  const applyPriceToAll = () => {
    setItems((prev) => prev.map((item) => ({ ...item, priceFrom: batchPrice })));
  };

  const handleCreate = async () => {
    setError(null);
    if (items.length === 0) {
      setError("Select at least one product image.");
      return;
    }
    if (items.length > MAX_BULK_QUICK_PRODUCTS) {
      setError(`You can add up to ${MAX_BULK_QUICK_PRODUCTS} products at a time.`);
      return;
    }

    const payloadItems = items.map((item) => ({
      name: item.name.trim(),
      categoryId: item.categoryId as CategoryId,
      priceFrom: item.priceFrom.trim() ? item.priceFrom : undefined,
      image: item.image!,
    }));

    const parsed = bulkProductQuickCreateSchema.safeParse({ items: payloadItems });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setError(first?.message ?? "Check each product’s name, category, and image.");
      return;
    }

    for (const item of items) {
      if (item.priceFrom.trim() && !isValidProductPriceInput(item.priceFrom)) {
        setError(`Enter a valid price for “${item.name}”, for example 1800.`);
        return;
      }
    }

    setBusy(true);
    setProgress(`Creating ${items.length} products…`);
    try {
      const result = await bulkCreateAdminProducts({ data: parsed.data });
      for (const item of items) URL.revokeObjectURL(item.previewUrl);
      setItems([]);
      await router.invalidate();
      setSuccessCount(result.count);
      setProgress(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create products. Try again.");
      setProgress(null);
    } finally {
      setBusy(false);
    }
  };

  if (successCount !== null) {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-6">
        <div className="rounded-xl border border-border bg-surface/20 p-6 text-center space-y-3">
          <Layers className="mx-auto h-8 w-8 text-muted" aria-hidden />
          <h1 className="font-display text-3xl italic tracking-tight">
            {successCount} products added as hidden drafts.
          </h1>
          <p className="text-sm text-muted">
            They are hidden from the public site. Open each product to finish details when ready.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild className="h-11">
              <Link to="/admin/products">View products</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => {
                setSuccessCount(null);
              }}
            >
              Add more
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex items-start gap-3">
        <Button type="button" variant="outline" className="h-11 w-11 shrink-0 px-0" asChild>
          <Link to="/admin/products" aria-label="Back to products">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="font-display text-3xl md:text-4xl italic tracking-tight">Bulk add</h1>
          <p className="text-sm text-muted mt-1">
            Select multiple photos, set names and categories, then create hidden drafts.
          </p>
        </div>
      </div>

      {error ? <AdminActionError message={error} /> : null}
      {progress ? <p className="text-sm text-muted">{progress}</p> : null}

      <div className="rounded-xl border border-border bg-surface/20 p-4 space-y-4">
        <input
          ref={fileInputRef}
          id={fileInputId}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={busy}
          onChange={(e) => void handleFilesSelected(e.target.files)}
        />
        <Button
          type="button"
          className="h-11 w-full"
          disabled={busy || items.length >= MAX_BULK_QUICK_PRODUCTS}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-4 h-4 mr-2" />
          {items.length === 0 ? "Select product photos" : "Add more photos"}
        </Button>
        <p className="text-xs text-muted">
          JPEG, PNG or WebP · up to {MAX_BULK_QUICK_PRODUCTS} per batch · {items.length} selected
        </p>
      </div>

      {items.length > 0 ? (
        <div className="rounded-xl border border-border bg-surface/20 p-4 space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
            Apply to all
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
            <AdminField label="Category" htmlFor="batch-category">
              <select
                id="batch-category"
                value={batchCategory}
                onChange={(e) => setBatchCategory(e.target.value)}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={busy}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </AdminField>
            <Button
              type="button"
              variant="outline"
              className="h-11"
              disabled={busy}
              onClick={applyCategoryToAll}
            >
              Apply to all
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
            <AdminField label="Price from (optional)" htmlFor="batch-price">
              <Input
                id="batch-price"
                value={batchPrice}
                onChange={(e) => setBatchPrice(e.target.value)}
                className="h-11"
                inputMode="decimal"
                placeholder="1800"
                disabled={busy}
              />
            </AdminField>
            <Button
              type="button"
              variant="outline"
              className="h-11"
              disabled={busy}
              onClick={applyPriceToAll}
            >
              Apply to all
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        {items.map((item, index) => (
          <article
            key={item.localId}
            className="rounded-xl border border-border bg-background p-3 space-y-3"
          >
            <div className="flex gap-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/20">
                <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-muted">Product {index + 1}</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-10 shrink-0 px-0 text-destructive"
                    disabled={busy}
                    onClick={() => removeItem(item.localId)}
                    aria-label={`Remove product ${index + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Input
                  value={item.name}
                  onChange={(e) => updateItem(item.localId, { name: e.target.value })}
                  className="h-11"
                  placeholder="Product name"
                  disabled={busy}
                  aria-label={`Name for product ${index + 1}`}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={item.categoryId}
                onChange={(e) => updateItem(item.localId, { categoryId: e.target.value })}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={busy}
                aria-label={`Category for product ${index + 1}`}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <Input
                value={item.priceFrom}
                onChange={(e) => updateItem(item.localId, { priceFrom: e.target.value })}
                className="h-11"
                inputMode="decimal"
                placeholder="Price from (optional)"
                disabled={busy}
                aria-label={`Price for product ${index + 1}`}
              />
            </div>
          </article>
        ))}
      </div>

      {items.length > 0 ? (
        <div className="sticky bottom-0 z-10 -mx-1 border-t border-border bg-background/95 px-1 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <Button
            type="button"
            className={cn("h-11 w-full")}
            disabled={busy}
            onClick={() => void handleCreate()}
          >
            {busy ? "Creating…" : `Create ${items.length} products`}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="mt-2 h-11 w-full"
            disabled={busy}
            onClick={() => {
              if (dirty && !window.confirm("Discard unsaved bulk products?")) return;
              resetDrafts();
            }}
          >
            Clear all
          </Button>
        </div>
      ) : null}

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full sm:w-auto"
        disabled={busy}
        onClick={() => {
          if (dirty && !window.confirm("Leave without creating these products?")) return;
          void navigate({ to: "/admin/products" });
        }}
      >
        Cancel
      </Button>
    </div>
  );
}
