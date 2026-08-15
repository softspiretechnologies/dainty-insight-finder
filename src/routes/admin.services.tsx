import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Check, ExternalLink, ImagePlus, Sparkles } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AdminField, FormErrorBanner, invalidBoxClass } from "@/components/admin/AdminField";
import { AdminSaveStatus } from "@/components/admin/AdminSaveStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BulletTextarea } from "@/components/ui/bullet-textarea";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { canMoveItem } from "@/lib/admin-reorder";
import { adminServiceFormSchema, adminServicesPageFormSchema } from "@/lib/admin-schemas";
import {
  invalidInputClass,
  scrollToFirstField,
  validateForm,
  type FieldErrors,
} from "@/lib/admin-validation";
import { fileToUploadPayload } from "@/lib/admin-upload-payload";
import { normalizeProductDetails } from "@/lib/product-details";
import {
  listAdminServicesData,
  moveAdminService,
  saveAdminService,
  saveAdminServicesPage,
} from "@/lib/api/admin/services";
import { cn } from "@/lib/utils";
import type { ServiceId } from "@/types/catalog";

export const Route = createFileRoute("/admin/services")({
  loader: async () => listAdminServicesData(),
  component: AdminServicesPage,
});

type ServiceRow = {
  id: string;
  title: string;
  blurb: string;
  bullets: string[];
  imagePath: string;
  sortOrder: number;
};

type PageContent = {
  intro: string;
  footerTitle: string;
  footerBlurb: string;
};

function AdminServicesPage() {
  const { services, page } = Route.useLoaderData();
  const router = useRouter();
  const [pageFormDirty, setPageFormDirty] = useState(false);
  const [dirtyById, setDirtyById] = useState<Record<string, boolean>>({});
  const [movingId, setMovingId] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);

  const sortable = useMemo(
    () => services.map((service) => ({ id: service.id, sortOrder: service.sortOrder })),
    [services],
  );
  const pageDirty = pageFormDirty || Object.values(dirtyById).some(Boolean);
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
    setMovingId(id);
    try {
      await moveAdminService({ data: { id, direction } });
      await router.invalidate();
    } catch (err) {
      setMoveError(err instanceof Error ? err.message : "Failed to reorder service");
    } finally {
      setMovingId(null);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl md:text-5xl italic tracking-tight">Services</h1>
        <p className="text-sm text-muted mt-1.5">
          Edit the celebration services page — intro text, service blocks, images and bullet lists.
        </p>
      </div>

      <PageContentForm
        page={page}
        onSaved={() => router.invalidate()}
        onDirtyChange={setPageFormDirty}
      />

      <section>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted mb-3">
          Service blocks
        </p>
        {moveError ? <FormErrorBanner message={moveError} /> : null}
        {pageDirty ? (
          <p className="text-xs text-muted mb-3">Save or discard edits before reordering.</p>
        ) : null}
        <Accordion type="single" collapsible className="space-y-3">
          {services.map((service) => {
            const canUp = canMoveItem(sortable, service.id, "up");
            const canDown = canMoveItem(sortable, service.id, "down");
            const isMoving = movingId === service.id;

            return (
              <AccordionItem
                key={service.id}
                value={service.id}
                className="border border-border rounded-xl bg-surface/20 overflow-hidden"
              >
                <div className="flex items-stretch gap-1">
                  <AccordionTrigger className="flex-1 px-4 py-4 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-border">
                    <ServiceSummary service={service} />
                  </AccordionTrigger>
                  <div className="flex flex-col justify-center gap-1 py-2 pr-3 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      disabled={!canUp || pageDirty || Boolean(movingId)}
                      aria-label={`Move ${service.title} up`}
                      onClick={() => handleMove(service.id, "up")}
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
                      aria-label={`Move ${service.title} down`}
                      onClick={() => handleMove(service.id, "down")}
                    >
                      <ArrowDown className="w-3.5 h-3.5 mr-1" />
                      Move down
                    </Button>
                  </div>
                </div>
                <AccordionContent className="px-4 pb-5 pt-4">
                  <ServiceForm
                    service={service}
                    onSaved={() => router.invalidate()}
                    onDirtyChange={handleDirtyChange}
                  />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </section>
    </div>
  );
}

function PageContentForm({
  page,
  onSaved,
  onDirtyChange,
}: {
  page: PageContent;
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [intro, setIntro] = useState(page.intro);
  const [footerTitle, setFooterTitle] = useState(page.footerTitle);
  const [footerBlurb, setFooterBlurb] = useState(page.footerBlurb);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    setIntro(page.intro);
    setFooterTitle(page.footerTitle);
    setFooterBlurb(page.footerBlurb);
    setSavedMessage(null);
    setFormError(null);
    setFieldErrors({});
  }, [page.intro, page.footerTitle, page.footerBlurb]);

  const isDirty =
    intro !== page.intro || footerTitle !== page.footerTitle || footerBlurb !== page.footerBlurb;

  useEffect(() => {
    onDirtyChange(isDirty && !loading);
  }, [isDirty, loading, onDirtyChange]);

  useEffect(() => {
    return () => onDirtyChange(false);
  }, [onDirtyChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSavedMessage(null);

    const validation = validateForm(adminServicesPageFormSchema, {
      intro,
      footerTitle,
      footerBlurb,
    });
    if (!validation.ok) {
      setFieldErrors(validation.errors);
      scrollToFirstField(validation.errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      await saveAdminServicesPage({ data: validation.data });
      setSavedMessage("Saved");
      onSaved();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save page content");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="border border-border rounded-xl bg-surface/20 p-4 md:p-5 space-y-5"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">Page content</p>

      <AdminField
        label="Intro paragraph"
        htmlFor="services-intro"
        required
        error={fieldErrors.intro}
      >
        <Textarea
          id="services-intro"
          value={intro}
          onChange={(e) => {
            setIntro(e.target.value);
            setSavedMessage(null);
          }}
          rows={3}
          className={cn("resize-none", invalidInputClass(fieldErrors.intro))}
        />
      </AdminField>

      <AdminField
        label="Footer heading"
        htmlFor="services-footer-title"
        required
        error={fieldErrors.footerTitle}
      >
        <Input
          id="services-footer-title"
          value={footerTitle}
          onChange={(e) => {
            setFooterTitle(e.target.value);
            setSavedMessage(null);
          }}
          className={`h-11 ${invalidInputClass(fieldErrors.footerTitle)}`}
        />
      </AdminField>

      <AdminField
        label="Footer text"
        htmlFor="services-footer-blurb"
        required
        error={fieldErrors.footerBlurb}
      >
        <Textarea
          id="services-footer-blurb"
          value={footerBlurb}
          onChange={(e) => {
            setFooterBlurb(e.target.value);
            setSavedMessage(null);
          }}
          rows={3}
          className={cn("resize-none", invalidInputClass(fieldErrors.footerBlurb))}
        />
      </AdminField>

      {formError ? <FormErrorBanner message={formError} /> : null}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button type="submit" className="h-11" disabled={loading || (!isDirty && !savedMessage)}>
          {loading ? "Saving…" : savedMessage && !isDirty ? "Saved" : "Save page content"}
        </Button>
        <AdminSaveStatus message={!isDirty ? savedMessage : null} />
      </div>
    </form>
  );
}

function ServiceSummary({ service }: { service: ServiceRow }) {
  return (
    <div className="flex items-center gap-3 text-left min-w-0 flex-1 pr-2">
      <div className="w-14 h-14 shrink-0 overflow-hidden rounded-md border border-border bg-surface">
        {service.imagePath ? (
          <img src={service.imagePath} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-muted/30">
            <Sparkles className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm leading-snug">{service.title}</p>
        <p className="text-xs text-muted mt-0.5 line-clamp-1">{service.blurb}</p>
      </div>
    </div>
  );
}

function ServiceForm({
  service,
  onSaved,
  onDirtyChange,
}: {
  service: ServiceRow;
  onSaved: () => void;
  onDirtyChange: (id: string, dirty: boolean) => void;
}) {
  const fileInputId = useId();
  const [title, setTitle] = useState(service.title);
  const [blurb, setBlurb] = useState(service.blurb);
  const [bullets, setBullets] = useState(normalizeProductDetails(service.bullets).join("\n"));
  const [sortOrder, setSortOrder] = useState(String(service.sortOrder));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const previewSrc = previewUrl ?? service.imagePath;
  const initialBullets = normalizeProductDetails(service.bullets).join("\n");

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
    setTitle(service.title);
    setBlurb(service.blurb);
    setBullets(normalizeProductDetails(service.bullets).join("\n"));
    setSortOrder(String(service.sortOrder));
    setImageFile(null);
    setSavedMessage(null);
    setFormError(null);
    setFieldErrors({});
  }, [
    service.id,
    service.title,
    service.blurb,
    service.bullets,
    service.sortOrder,
    service.imagePath,
  ]);

  const isDirty = useMemo(
    () =>
      title !== service.title ||
      blurb !== service.blurb ||
      bullets !== initialBullets ||
      imageFile !== null,
    [title, blurb, bullets, imageFile, service.title, service.blurb, initialBullets],
  );

  useEffect(() => {
    onDirtyChange(service.id, isDirty && !loading);
  }, [service.id, isDirty, loading, onDirtyChange]);

  useEffect(() => {
    return () => onDirtyChange(service.id, false);
  }, [service.id, onDirtyChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSavedMessage(null);

    const validation = validateForm(adminServiceFormSchema, { title, blurb, bullets, sortOrder });
    if (!validation.ok) {
      setFieldErrors(validation.errors);
      scrollToFirstField(validation.errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      await saveAdminService({
        data: {
          id: service.id as ServiceId,
          ...validation.data,
          existingImagePath: service.imagePath,
          image: imageFile ? await fileToUploadPayload(imageFile) : undefined,
        },
      });
      setImageFile(null);
      setSavedMessage("Saved");
      onSaved();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="space-y-3">
        <p className="text-sm font-medium leading-none">
          Service image<span className="text-destructive ml-0.5">*</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div
            className={cn(
              "w-full sm:w-48 aspect-4/3 overflow-hidden rounded-lg border bg-surface shrink-0",
              invalidBoxClass(fieldErrors.image),
            )}
          >
            {previewSrc ? (
              <img
                src={previewSrc}
                alt={`${title} preview`}
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
              <p className="text-xs text-muted">JPEG, PNG or WebP · max 5 MB.</p>
            )}
          </div>
        </div>
      </div>

      <AdminField label="Title" htmlFor={`${service.id}-title`} required error={fieldErrors.title}>
        <Input
          id={`${service.id}-title`}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setSavedMessage(null);
          }}
          className={`h-11 ${invalidInputClass(fieldErrors.title)}`}
        />
      </AdminField>

      <AdminField
        label="Description"
        htmlFor={`${service.id}-blurb`}
        required
        error={fieldErrors.blurb}
      >
        <Textarea
          id={`${service.id}-blurb`}
          value={blurb}
          onChange={(e) => {
            setBlurb(e.target.value);
            setSavedMessage(null);
          }}
          rows={4}
          className={cn("resize-none", invalidInputClass(fieldErrors.blurb))}
        />
      </AdminField>

      <AdminField
        label="Bullet points"
        htmlFor={`${service.id}-bullets`}
        required
        error={fieldErrors.bullets}
        hint="One point per line — shown under each service."
      >
        <BulletTextarea
          id={`${service.id}-bullets`}
          value={bullets}
          onChange={(value) => {
            setBullets(value);
            setSavedMessage(null);
          }}
          rows={5}
          className={invalidInputClass(fieldErrors.bullets)}
        />
      </AdminField>

      {formError ? <FormErrorBanner message={formError} /> : null}

      <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 pt-1">
        <Button
          type="submit"
          className="w-full sm:w-auto h-11 min-w-[130px]"
          disabled={loading || (!isDirty && !savedMessage)}
        >
          {loading ? (
            "Saving…"
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
          <Link to="/services" target="_blank" className="inline-flex items-center gap-2">
            View services page
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>
    </form>
  );
}
