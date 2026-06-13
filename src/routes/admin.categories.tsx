import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Check, ExternalLink, ImagePlus } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fileToUploadPayload } from "@/lib/admin-upload-payload";
import { listAdminCategories, saveAdminCategory } from "@/lib/api/admin/categories";
import { cn } from "@/lib/utils";
import type { CategoryId } from "@/types/catalog";

export const Route = createFileRoute("/admin/categories")({
  loader: async () => {
    const categories = await listAdminCategories();
    return { categories };
  },
  component: AdminCategoriesPage,
});

type CategoryRow = {
  id: string;
  label: string;
  blurb: string;
  imagePath: string;
  sortOrder: number;
};

function AdminCategoriesPage() {
  const { categories } = Route.useLoaderData();
  const router = useRouter();

  return (
    <div className="max-w-3xl">
      <div className="mb-6 md:mb-8">
        <h1 className="font-display text-2xl md:text-4xl italic tracking-tight">Categories</h1>
        <p className="text-sm text-muted mt-1">
          {categories.length} categories shown on the homepage and catalog filters.
        </p>
      </div>

      {/* Quick preview strip */}
      <section className="mb-6 md:mb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted mb-3">Homepage preview</p>
        <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => (
            <div key={category.id} className="shrink-0 w-28">
              <div className="aspect-[4/5] overflow-hidden rounded-md border border-border bg-surface">
                {category.imagePath ? (
                  <img src={category.imagePath} alt="" className="w-full h-full object-cover" />
                ) : null}
              </div>
              <p className="text-[11px] font-medium mt-2 leading-tight line-clamp-2">{category.label}</p>
            </div>
          ))}
        </div>
      </section>

      <Accordion type="single" collapsible className="space-y-3">
        {categories.map((category) => (
          <AccordionItem
            key={category.id}
            value={category.id}
            className="border border-border rounded-lg bg-surface/20 overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-4 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-border">
              <CategorySummary category={category} />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-5 pt-4">
              <CategoryForm
                category={category}
                onSaved={() => router.invalidate()}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function CategorySummary({ category }: { category: CategoryRow }) {
  return (
    <div className="flex items-center gap-3 text-left min-w-0 flex-1 pr-2">
      <div className="w-14 h-14 shrink-0 overflow-hidden rounded-md border border-border bg-surface">
        {category.imagePath ? (
          <img src={category.imagePath} alt="" className="w-full h-full object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm leading-snug">{category.label}</p>
        <p className="text-xs text-muted mt-0.5 line-clamp-1">{category.blurb}</p>
        <p className="font-mono text-[10px] text-muted/80 mt-1">{category.id}</p>
      </div>
      <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted border border-border rounded-full px-2 py-0.5">
        #{category.sortOrder}
      </span>
    </div>
  );
}

function CategoryForm({
  category,
  onSaved,
}: {
  category: CategoryRow;
  onSaved: () => void;
}) {
  const fileInputId = useId();
  const [label, setLabel] = useState(category.label);
  const [blurb, setBlurb] = useState(category.blurb);
  const [sortOrder, setSortOrder] = useState(String(category.sortOrder));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const previewSrc = previewUrl ?? category.imagePath;

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    setLabel(category.label);
    setBlurb(category.blurb);
    setSortOrder(String(category.sortOrder));
    setImageFile(null);
    setSuccess(false);
    setError(null);
  }, [category.id, category.label, category.blurb, category.sortOrder, category.imagePath]);

  const isDirty = useMemo(
    () =>
      label !== category.label ||
      blurb !== category.blurb ||
      sortOrder !== String(category.sortOrder) ||
      imageFile !== null,
    [label, blurb, sortOrder, imageFile, category],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await saveAdminCategory({
        data: {
          id: category.id as CategoryId,
          label,
          blurb,
          sortOrder: Number(sortOrder),
          existingImagePath: category.imagePath,
          image: imageFile ? await fileToUploadPayload(imageFile) : undefined,
        },
      });
      setImageFile(null);
      setSuccess(true);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Image block */}
      <div className="space-y-3">
        <Label>Category image</Label>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="w-full sm:w-40 aspect-[4/5] overflow-hidden rounded-lg border border-border bg-surface shrink-0">
            {previewSrc ? (
              <img src={previewSrc} alt={`${label} preview`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-xs text-muted">No image</div>
            )}
          </div>
          <div className="flex-1 w-full space-y-2">
            <input
              id={fileInputId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                setImageFile(e.target.files?.[0] ?? null);
                setSuccess(false);
              }}
            />
            <Button type="button" variant="outline" className="w-full sm:w-auto h-11" asChild>
              <label htmlFor={fileInputId} className="cursor-pointer">
                <ImagePlus className="w-4 h-4 mr-2" />
                {imageFile ? "Replace image" : "Upload new image"}
              </label>
            </Button>
            {imageFile ? (
              <p className="text-xs text-muted truncate">{imageFile.name}</p>
            ) : (
              <p className="text-xs text-muted">JPEG, PNG or WebP · max 5 MB. Leave unchanged to keep current image.</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${category.id}-label`}>Display label</Label>
        <Input
          id={`${category.id}-label`}
          value={label}
          onChange={(e) => {
            setLabel(e.target.value);
            setSuccess(false);
          }}
          required
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${category.id}-blurb`}>Short blurb</Label>
        <Textarea
          id={`${category.id}-blurb`}
          value={blurb}
          onChange={(e) => {
            setBlurb(e.target.value);
            setSuccess(false);
          }}
          rows={3}
          required
          className="resize-none"
        />
        <p className="text-xs text-muted">Shown on the homepage category grid and catalog chips.</p>
      </div>

      <div className="space-y-2 max-w-[8rem]">
        <Label htmlFor={`${category.id}-sort`}>Sort order</Label>
        <Input
          id={`${category.id}-sort`}
          type="number"
          min={0}
          value={sortOrder}
          onChange={(e) => {
            setSortOrder(e.target.value);
            setSuccess(false);
          }}
          required
          className="h-11"
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 pt-1">
        <Button
          type="submit"
          className="w-full sm:w-auto h-11"
          disabled={loading || (!isDirty && !success)}
        >
          {loading ? "Saving…" : success && !isDirty ? (
            <span className="inline-flex items-center gap-2">
              <Check className="w-4 h-4" />
              Saved
            </span>
          ) : (
            "Save changes"
          )}
        </Button>

        <Button variant="outline" className="w-full sm:w-auto h-11" asChild>
          <Link
            to="/catalog"
            search={{ category: category.id as CategoryId }}
            target="_blank"
            className="inline-flex items-center gap-2"
          >
            View in catalog
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </Button>

        {isDirty && !loading ? (
          <span className={cn("text-xs text-muted sm:ml-auto", "sm:order-last")}>Unsaved changes</span>
        ) : null}
      </div>
    </form>
  );
}
