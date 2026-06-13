import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Check, ExternalLink, ImagePlus, Sparkles } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AdminField, FormErrorBanner, FormSuccessBanner, invalidBoxClass } from "@/components/admin/AdminField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BulletTextarea } from "@/components/ui/bullet-textarea";
import { adminServiceFormSchema, adminServicesPageFormSchema } from "@/lib/admin-schemas";
import { invalidInputClass, scrollToFirstField, validateForm, type FieldErrors } from "@/lib/admin-validation";
import { fileToUploadPayload } from "@/lib/admin-upload-payload";
import { normalizeProductDetails } from "@/lib/product-details";
import {
  listAdminServicesData,
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

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl md:text-5xl italic tracking-tight">Services</h1>
        <p className="text-sm text-muted mt-1.5">
          Edit the celebration services page — intro text, service blocks, images and bullet lists.
        </p>
      </div>

      <PageContentForm page={page} onSaved={() => router.invalidate()} />

      <section>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted mb-3">Service blocks</p>
        <Accordion type="single" collapsible className="space-y-3">
          {services.map((service) => (
            <AccordionItem
              key={service.id}
              value={service.id}
              className="border border-border rounded-xl bg-surface/20 overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-4 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-border">
                <ServiceSummary service={service} />
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-4">
                <ServiceForm service={service} onSaved={() => router.invalidate()} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}

function PageContentForm({ page, onSaved }: { page: PageContent; onSaved: () => void }) {
  const [intro, setIntro] = useState(page.intro);
  const [footerTitle, setFooterTitle] = useState(page.footerTitle);
  const [footerBlurb, setFooterBlurb] = useState(page.footerBlurb);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setIntro(page.intro);
    setFooterTitle(page.footerTitle);
    setFooterBlurb(page.footerBlurb);
    setSuccess(false);
    setFormError(null);
    setFieldErrors({});
  }, [page.intro, page.footerTitle, page.footerBlurb]);

  const isDirty =
    intro !== page.intro || footerTitle !== page.footerTitle || footerBlurb !== page.footerBlurb;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(false);

    const validation = validateForm(adminServicesPageFormSchema, { intro, footerTitle, footerBlurb });
    if (!validation.ok) {
      setFieldErrors(validation.errors);
      scrollToFirstField(validation.errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      await saveAdminServicesPage({ data: validation.data });
      setSuccess(true);
      onSaved();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save page content");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="border border-border rounded-xl bg-surface/20 p-4 md:p-5 space-y-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">Page content</p>

      <AdminField label="Intro paragraph" htmlFor="services-intro" required error={fieldErrors.intro}>
        <Textarea
          id="services-intro"
          value={intro}
          onChange={(e) => {
            setIntro(e.target.value);
            setSuccess(false);
          }}
          rows={3}
          className={cn("resize-none", invalidInputClass(fieldErrors.intro))}
        />
      </AdminField>

      <AdminField label="Footer heading" htmlFor="services-footer-title" required error={fieldErrors.footerTitle}>
        <Input
          id="services-footer-title"
          value={footerTitle}
          onChange={(e) => {
            setFooterTitle(e.target.value);
            setSuccess(false);
          }}
          className={`h-11 ${invalidInputClass(fieldErrors.footerTitle)}`}
        />
      </AdminField>

      <AdminField label="Footer text" htmlFor="services-footer-blurb" required error={fieldErrors.footerBlurb}>
        <Textarea
          id="services-footer-blurb"
          value={footerBlurb}
          onChange={(e) => {
            setFooterBlurb(e.target.value);
            setSuccess(false);
          }}
          rows={3}
          className={cn("resize-none", invalidInputClass(fieldErrors.footerBlurb))}
        />
      </AdminField>

      {formError ? <FormErrorBanner message={formError} /> : null}
      {success && !isDirty ? <FormSuccessBanner message="Page content saved." /> : null}

      <Button type="submit" className="h-11" disabled={loading || (!isDirty && !success)}>
        {loading ? "Saving…" : success && !isDirty ? "Saved" : "Save page content"}
      </Button>
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
      <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted border border-border rounded-full px-2 py-0.5">
        #{service.sortOrder}
      </span>
    </div>
  );
}

function ServiceForm({ service, onSaved }: { service: ServiceRow; onSaved: () => void }) {
  const fileInputId = useId();
  const [title, setTitle] = useState(service.title);
  const [blurb, setBlurb] = useState(service.blurb);
  const [bullets, setBullets] = useState(normalizeProductDetails(service.bullets).join("\n"));
  const [sortOrder, setSortOrder] = useState(String(service.sortOrder));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const previewSrc = previewUrl ?? service.imagePath;

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
    setSuccess(false);
    setFormError(null);
    setFieldErrors({});
  }, [service.id, service.title, service.blurb, service.bullets, service.sortOrder, service.imagePath]);

  const isDirty = useMemo(
    () =>
      title !== service.title ||
      blurb !== service.blurb ||
      bullets !== normalizeProductDetails(service.bullets).join("\n") ||
      sortOrder !== String(service.sortOrder) ||
      imageFile !== null,
    [title, blurb, bullets, sortOrder, imageFile, service],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(false);

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
      setSuccess(true);
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
          <div className={cn("w-full sm:w-48 aspect-4/3 overflow-hidden rounded-lg border bg-surface shrink-0", invalidBoxClass(fieldErrors.image))}>
            {previewSrc ? (
              <img src={previewSrc} alt={`${title} preview`} className="w-full h-full object-cover" />
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
            setSuccess(false);
          }}
          className={`h-11 ${invalidInputClass(fieldErrors.title)}`}
        />
      </AdminField>

      <AdminField label="Description" htmlFor={`${service.id}-blurb`} required error={fieldErrors.blurb}>
        <Textarea
          id={`${service.id}-blurb`}
          value={blurb}
          onChange={(e) => {
            setBlurb(e.target.value);
            setSuccess(false);
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
          onChange={(e) => {
            setBullets(e.target.value);
            setSuccess(false);
          }}
          rows={5}
          className={invalidInputClass(fieldErrors.bullets)}
        />
      </AdminField>

      <AdminField label="Sort order" htmlFor={`${service.id}-sort`} required error={fieldErrors.sortOrder}>
        <Input
          id={`${service.id}-sort`}
          type="number"
          min={0}
          value={sortOrder}
          onChange={(e) => {
            setSortOrder(e.target.value);
            setSuccess(false);
          }}
          className={`h-11 max-w-[8rem] ${invalidInputClass(fieldErrors.sortOrder)}`}
        />
      </AdminField>

      {formError ? <FormErrorBanner message={formError} /> : null}

      <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 pt-1">
        <Button type="submit" className="w-full sm:w-auto h-11 min-w-[130px]" disabled={loading || (!isDirty && !success)}>
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
          <Link to="/services" target="_blank" className="inline-flex items-center gap-2">
            View services page
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>
    </form>
  );
}
