import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Check, ExternalLink, ImagePlus, Tags } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AdminActionError } from "@/components/admin/AdminActionError";
import { AdminField, invalidBoxClass } from "@/components/admin/AdminField";
import { AdminPagePending } from "@/components/admin/AdminSkeleton";
import { AdminSaveStatus } from "@/components/admin/AdminSaveStatus";
import { AdminSeoFields } from "@/components/admin/AdminSeoFields";
import { OptimizedImage, adminThumbSizes } from "@/components/ui/optimized-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { canMoveItem } from "@/lib/admin-reorder";
import { adminCategoryFormSchema } from "@/lib/admin-schemas";
import { catalogPath, getCatalogSeo } from "@/lib/catalog-seo";
import {
  invalidInputClass,
  scrollToFirstField,
  validateForm,
  type FieldErrors,
} from "@/lib/admin-validation";
import { fileToUploadPayload } from "@/lib/admin-upload-payload";
import {
  listAdminCategories,
  moveAdminCategory,
  saveAdminCategory,
} from "@/lib/api/admin/categories";
import { cn } from "@/lib/utils";
import type { CategoryId } from "@/types/catalog";

export const Route = createFileRoute("/admin/categories")({
  loader: async () => {
    const categories = await listAdminCategories();
    return { categories };
  },
  pendingComponent: () => <AdminPagePending label="Loading categories…" />,
  component: AdminCategoriesPage,
});

type CategoryRow = {
  id: string;
  label: string;
  blurb: string;
  metaTitle: string | null;
  metaDescription: string | null;
  imagePath: string;
  sortOrder: number;
};

function AdminCategoriesPage() {
  const { categories } = Route.useLoaderData();
  const router = useRouter();
  const [dirtyById, setDirtyById] = useState<Record<string, boolean>>({});
  const [movingId, setMovingId] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ id: string; direction: "up" | "down" } | null>(null);

  const sortable = useMemo(
    () => categories.map((category) => ({ id: category.id, sortOrder: category.sortOrder })),
    [categories],
  );
  const pageDirty = Object.values(dirtyById).some(Boolean);
  useUnsavedChangesGuard(pageDirty);

  const handleDirtyChange = useCallback((id: string, dirty: boolean) => {
    setDirtyById((prev) => {
      if (Boolean(prev[id]) === dirty) return prev;
      return { ...prev, [id]: dirty };
    });
  }, []);

  const handleMove = async (id: string, direction: "up" | "down") => {
    if (pageDirty || movingId) return;
    setMoveError(null);
    setLastMove({ id, direction });
    setMovingId(id);
    try {
      await moveAdminCategory({ data: { id, direction } });
      await router.invalidate();
    } catch (err) {
      setMoveError(err instanceof Error ? err.message : "Failed to reorder category");
    } finally {
      setMovingId(null);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6 md:mb-8">
        <h1 className="font-display text-3xl md:text-5xl italic tracking-tight">Categories</h1>
        <p className="text-sm text-muted mt-1.5">
          {categories.length} categories · shown on the homepage grid and catalog filters.
        </p>
      </div>

      {/* Quick preview strip */}
      <section className="mb-6 md:mb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted mb-3">
          Homepage preview
        </p>
        <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => (
            <div key={category.id} className="shrink-0 w-24 sm:w-28">
              <div className="aspect-[4/5] overflow-hidden rounded-lg border border-border bg-surface">
                {category.imagePath ? (
                  <OptimizedImage
                    src={category.imagePath}
                    alt=""
                    width={112}
                    height={140}
                    sizes="112px"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-muted/30">
                    <Tags className="w-5 h-5" />
                  </div>
                )}
              </div>
              <p className="text-[11px] font-medium mt-2 leading-tight line-clamp-2">
                {category.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {moveError ? (
        <AdminActionError
          message={moveError}
          onRetry={
            lastMove && !movingId && !pageDirty
              ? () => void handleMove(lastMove.id, lastMove.direction)
              : undefined
          }
        />
      ) : null}
      {pageDirty ? (
        <p className="text-xs text-muted mb-3">Save or discard edits before reordering.</p>
      ) : null}

      {categories.length === 0 ? (
        <div className="text-sm text-muted border border-dashed border-border rounded-xl p-6 text-center space-y-1 mb-3">
          <p className="font-medium text-foreground/80">No categories yet</p>
          <p>Categories will appear here once they are available.</p>
        </div>
      ) : null}

      <Accordion type="single" collapsible className="space-y-3">
        {categories.map((category) => {
          const canUp = canMoveItem(sortable, category.id, "up");
          const canDown = canMoveItem(sortable, category.id, "down");
          const isMoving = movingId === category.id;

          return (
            <AccordionItem
              key={category.id}
              value={category.id}
              className="border border-border rounded-xl bg-surface/20 overflow-hidden"
            >
              <div className="flex items-stretch gap-1">
                <AccordionTrigger className="flex-1 px-4 py-4 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-border">
                  <CategorySummary category={category} />
                </AccordionTrigger>
                <div className="flex flex-col justify-center gap-1 py-2 pr-3 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    disabled={!canUp || pageDirty || Boolean(movingId)}
                    aria-label={`Move ${category.label} up`}
                    onClick={() => handleMove(category.id, "up")}
                  >
                    <ArrowUp className="w-3.5 h-3.5 mr-1" />
                    {isMoving ? "…" : "Move up"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    disabled={!canDown || pageDirty || Boolean(movingId)}
                    aria-label={`Move ${category.label} down`}
                    onClick={() => handleMove(category.id, "down")}
                  >
                    <ArrowDown className="w-3.5 h-3.5 mr-1" />
                    Move down
                  </Button>
                </div>
              </div>
              <AccordionContent className="px-4 pb-5 pt-4">
                <CategoryForm
                  category={category}
                  onSaved={() => router.invalidate()}
                  onDirtyChange={handleDirtyChange}
                />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

function CategorySummary({ category }: { category: CategoryRow }) {
  return (
    <div className="flex items-center gap-3 text-left min-w-0 flex-1 pr-2">
      <div className="w-14 h-14 shrink-0 overflow-hidden rounded-md border border-border bg-surface">
        {category.imagePath ? (
          <OptimizedImage
            src={category.imagePath}
            alt=""
            width={80}
            height={80}
            sizes={adminThumbSizes}
            className="w-full h-full object-cover"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm leading-snug">{category.label}</p>
        {category.blurb ? (
          <p className="text-xs text-muted mt-0.5 line-clamp-1">{category.blurb}</p>
        ) : null}
      </div>
    </div>
  );
}

function CategoryForm({
  category,
  onSaved,
  onDirtyChange,
}: {
  category: CategoryRow;
  onSaved: () => void;
  onDirtyChange: (id: string, dirty: boolean) => void;
}) {
  const fileInputId = useId();
  const [label, setLabel] = useState(category.label);
  const [blurb, setBlurb] = useState(category.blurb);
  const [seo, setSeo] = useState({
    metaTitle: category.metaTitle ?? "",
    metaDescription: category.metaDescription ?? "",
  });
  const [sortOrder, setSortOrder] = useState(String(category.sortOrder));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
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
    setSeo({
      metaTitle: category.metaTitle ?? "",
      metaDescription: category.metaDescription ?? "",
    });
    setSortOrder(String(category.sortOrder));
    setImageFile(null);
    setSavedMessage(null);
    setFormError(null);
    setFieldErrors({});
  }, [
    category.id,
    category.label,
    category.blurb,
    category.metaTitle,
    category.metaDescription,
    category.sortOrder,
    category.imagePath,
  ]);

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const isDirty = useMemo(
    () =>
      label !== category.label ||
      blurb !== category.blurb ||
      seo.metaTitle !== (category.metaTitle ?? "") ||
      seo.metaDescription !== (category.metaDescription ?? "") ||
      imageFile !== null,
    [label, blurb, seo, imageFile, category],
  );

  useEffect(() => {
    onDirtyChange(category.id, isDirty && !loading);
  }, [category.id, isDirty, loading, onDirtyChange]);

  useEffect(() => {
    return () => onDirtyChange(category.id, false);
  }, [category.id, onDirtyChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveCategory();
  };

  const saveCategory = async () => {
    setFormError(null);
    setSavedMessage(null);

    const validation = validateForm(adminCategoryFormSchema, {
      label,
      blurb,
      ...seo,
      sortOrder,
    });

    if (!validation.ok) {
      setFieldErrors(validation.errors);
      scrollToFirstField(validation.errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      await saveAdminCategory({
        data: {
          id: category.id as CategoryId,
          ...validation.data,
          existingImagePath: category.imagePath,
          image: imageFile ? await fileToUploadPayload(imageFile) : undefined,
        },
      });
      setImageFile(null);
      setSavedMessage("Saved");
      onSaved();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Image block */}
      <div className="space-y-3">
        <p className="text-sm font-medium leading-none">
          Category image<span className="text-destructive ml-0.5">*</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div
            className={cn(
              "w-full sm:w-40 aspect-4/5 overflow-hidden rounded-lg border bg-surface shrink-0",
              invalidBoxClass(fieldErrors.image),
            )}
          >
            {previewSrc ? (
              <img
                src={previewSrc}
                alt={`${label} preview`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-xs text-muted">
                No image
              </div>
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
                setSavedMessage(null);
                clearFieldError("image");
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
              <p className="text-xs text-muted">
                JPEG, PNG or WebP · max 5 MB. Leave unchanged to keep current image.
              </p>
            )}
          </div>
        </div>
      </div>

      <AdminField
        label="Category name"
        htmlFor={`${category.id}-label`}
        required
        error={fieldErrors.label}
      >
        <Input
          id={`${category.id}-label`}
          value={label}
          onChange={(e) => {
            setLabel(e.target.value);
            setSavedMessage(null);
            clearFieldError("label");
          }}
          className={`h-11 ${invalidInputClass(fieldErrors.label)}`}
        />
      </AdminField>

      <AdminField
        label="Short blurb"
        htmlFor={`${category.id}-blurb`}
        required
        error={fieldErrors.blurb}
        hint="Shown on the homepage category grid and catalog chips."
      >
        <Textarea
          id={`${category.id}-blurb`}
          value={blurb}
          onChange={(e) => {
            setBlurb(e.target.value);
            setSavedMessage(null);
            clearFieldError("blurb");
          }}
          rows={3}
          className={cn("resize-none", invalidInputClass(fieldErrors.blurb))}
        />
      </AdminField>

      <AdminSeoFields
        idPrefix={`${category.id}-`}
        value={seo}
        defaults={getCatalogSeo({ category: category.id as CategoryId }, [])}
        path={catalogPath(category.id as CategoryId)}
        errors={fieldErrors}
        onChange={(field, value) => {
          setSeo((current) => ({ ...current, [field]: value }));
          clearFieldError(field);
          setSavedMessage(null);
        }}
      />

      {formError ? (
        <AdminActionError
          message={formError}
          onRetry={
            Object.keys(fieldErrors).length === 0 && !loading
              ? () => void saveCategory()
              : undefined
          }
        />
      ) : null}

      <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 pt-1">
        <Button
          type="submit"
          className="w-full sm:w-auto h-11 min-w-[130px]"
          disabled={loading || (!isDirty && !savedMessage)}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Saving…
            </span>
          ) : savedMessage && !isDirty ? (
            <span className="inline-flex items-center gap-2">
              <Check className="w-4 h-4" />
              Saved
            </span>
          ) : (
            "Save changes"
          )}
        </Button>

        <AdminSaveStatus message={!isDirty ? savedMessage : null} />

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
      </div>
    </form>
  );
}
