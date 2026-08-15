import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ExternalLink, MessageSquareQuote, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminField, FormErrorBanner } from "@/components/admin/AdminField";
import { AdminSaveStatus } from "@/components/admin/AdminSaveStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import {
  adminTestimonialFormSchema,
  adminTestimonialsSectionFormSchema,
} from "@/lib/admin-schemas";
import {
  invalidInputClass,
  scrollToFirstField,
  validateForm,
  type FieldErrors,
} from "@/lib/admin-validation";
import {
  deleteAdminTestimonial,
  listAdminTestimonialsData,
  saveAdminTestimonial,
  saveAdminTestimonialsSection,
} from "@/lib/api/admin/testimonials";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/testimonials")({
  loader: async () => listAdminTestimonialsData(),
  component: AdminTestimonialsPage,
});

type TestimonialRow = {
  id: number;
  quote: string;
  customerName: string;
  location: string;
  context: string;
  sortOrder: number;
};

function AdminTestimonialsPage() {
  const { heading, testimonials } = Route.useLoaderData();
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [headingDirty, setHeadingDirty] = useState(false);
  const [dirtyById, setDirtyById] = useState<Record<string, boolean>>({});

  const nextSortOrder = useMemo(() => {
    if (testimonials.length === 0) return 0;
    return Math.max(...testimonials.map((item) => item.sortOrder)) + 1;
  }, [testimonials]);

  const pageDirty = headingDirty || Object.values(dirtyById).some(Boolean);
  useUnsavedChangesGuard(pageDirty);

  const handleDirtyChange = useCallback((id: string, dirty: boolean) => {
    setDirtyById((prev) => {
      if (Boolean(prev[id]) === dirty) return prev;
      return { ...prev, [id]: dirty };
    });
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    setDeleteError(null);
    try {
      await deleteAdminTestimonial({ data: { id: deleteTarget.id } });
      setDeleteTarget(null);
      await router.invalidate();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete testimonial");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl md:text-5xl italic tracking-tight">Testimonials</h1>
          <p className="text-sm text-muted mt-1.5">
            Manage customer quotes shown on the homepage testimonials section.
          </p>
        </div>
        <Button variant="outline" className="h-11 shrink-0" asChild>
          <Link to="/" target="_blank" className="inline-flex items-center gap-2">
            View homepage
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>

      <SectionHeadingForm
        heading={heading}
        onDirtyChange={setHeadingDirty}
        onSaved={() => router.invalidate()}
      />

      {deleteError ? <FormErrorBanner message={deleteError} /> : null}

      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
            {testimonials.length} testimonial{testimonials.length === 1 ? "" : "s"}
          </p>
          <Button
            type="button"
            variant="outline"
            className="h-9"
            onClick={() => setShowNew((v) => !v)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add testimonial
          </Button>
        </div>

        {showNew ? (
          <div className="mb-4 border border-border rounded-xl bg-surface/20 p-4 md:p-5">
            <p className="font-medium text-sm mb-4">New testimonial</p>
            <TestimonialForm
              testimonial={null}
              defaultSortOrder={nextSortOrder}
              onDirtyChange={(dirty) => handleDirtyChange("new", dirty)}
              onSaved={() => {
                handleDirtyChange("new", false);
                setShowNew(false);
                router.invalidate();
              }}
              onCancel={() => {
                handleDirtyChange("new", false);
                setShowNew(false);
              }}
            />
          </div>
        ) : null}

        {testimonials.length === 0 ? (
          <div className="text-sm text-muted border border-dashed border-border rounded-xl p-6 text-center space-y-1">
            <p className="font-medium text-foreground/80">No testimonials yet</p>
            <p>Customer quotes you add will appear here.</p>
          </div>
        ) : null}

        <Accordion type="single" collapsible className="space-y-3">
          {testimonials.map((testimonial) => (
            <AccordionItem
              key={testimonial.id}
              value={String(testimonial.id)}
              className="border border-border rounded-xl bg-surface/20 overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-4 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-border">
                <TestimonialSummary testimonial={testimonial} />
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-4 space-y-4">
                <TestimonialForm
                  testimonial={testimonial}
                  onDirtyChange={(dirty) => handleDirtyChange(String(testimonial.id), dirty)}
                  onSaved={() => router.invalidate()}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto h-10 text-destructive hover:text-destructive"
                  disabled={deletingId === testimonial.id}
                  onClick={() =>
                    setDeleteTarget({ id: testimonial.id, name: testimonial.customerName })
                  }
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deletingId === testimonial.id ? "Deleting…" : "Delete testimonial"}
                </Button>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && deletingId === null) setDeleteTarget(null);
        }}
        title={
          deleteTarget ? `Delete testimonial from "${deleteTarget.name}"?` : "Delete testimonial?"
        }
        description="This testimonial will be permanently removed."
        confirmLabel="Delete testimonial"
        cancelLabel="Cancel"
        destructive
        loading={deletingId !== null}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function SectionHeadingForm({
  heading,
  onDirtyChange,
  onSaved,
}: {
  heading: string;
  onDirtyChange: (dirty: boolean) => void;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(heading);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    setValue(heading);
    setSavedMessage(null);
    setFormError(null);
    setFieldErrors({});
  }, [heading]);

  const isDirty = value !== heading;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSavedMessage(null);

    const validation = validateForm(adminTestimonialsSectionFormSchema, { heading: value });
    if (!validation.ok) {
      setFieldErrors(validation.errors);
      scrollToFirstField(validation.errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      await saveAdminTestimonialsSection({ data: validation.data });
      setSavedMessage("Saved");
      onSaved();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save section heading");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="border border-border rounded-xl bg-surface/20 p-4 md:p-5 space-y-4"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
        Section heading
      </p>
      <AdminField
        label="Homepage heading"
        htmlFor="testimonials-heading"
        required
        error={fieldErrors.heading}
      >
        <Input
          id="testimonials-heading"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSavedMessage(null);
          }}
          className={`h-11 ${invalidInputClass(fieldErrors.heading)}`}
        />
      </AdminField>
      {formError ? <FormErrorBanner message={formError} /> : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" className="h-11" disabled={loading || !isDirty}>
          {loading ? "Saving…" : "Save heading"}
        </Button>
        <AdminSaveStatus message={!isDirty ? savedMessage : null} />
      </div>
    </form>
  );
}

function TestimonialSummary({ testimonial }: { testimonial: TestimonialRow }) {
  return (
    <div className="flex items-start gap-3 text-left min-w-0 flex-1 pr-2">
      <div className="w-10 h-10 shrink-0 rounded-full border border-border bg-surface grid place-items-center text-muted">
        <MessageSquareQuote className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display italic text-sm leading-snug line-clamp-2">
          "{testimonial.quote}"
        </p>
        <p className="text-xs text-muted mt-1">
          {testimonial.customerName} · {testimonial.location}
        </p>
      </div>
    </div>
  );
}

function TestimonialForm({
  testimonial,
  defaultSortOrder = 0,
  onDirtyChange,
  onSaved,
  onCancel,
}: {
  testimonial: TestimonialRow | null;
  defaultSortOrder?: number;
  onDirtyChange?: (dirty: boolean) => void;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const [quote, setQuote] = useState(testimonial?.quote ?? "");
  const [customerName, setCustomerName] = useState(testimonial?.customerName ?? "");
  const [location, setLocation] = useState(testimonial?.location ?? "");
  const [context, setContext] = useState(testimonial?.context ?? "");
  const sortOrder = testimonial?.sortOrder ?? defaultSortOrder;
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    setQuote(testimonial?.quote ?? "");
    setCustomerName(testimonial?.customerName ?? "");
    setLocation(testimonial?.location ?? "");
    setContext(testimonial?.context ?? "");
    setSavedMessage(null);
    setFormError(null);
    setFieldErrors({});
  }, [
    testimonial?.id,
    testimonial?.quote,
    testimonial?.customerName,
    testimonial?.location,
    testimonial?.context,
  ]);

  const isDirty = useMemo(() => {
    if (!testimonial) {
      return Boolean(quote || customerName || location || context);
    }
    return (
      quote !== testimonial.quote ||
      customerName !== testimonial.customerName ||
      location !== testimonial.location ||
      context !== testimonial.context
    );
  }, [quote, customerName, location, context, testimonial]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSavedMessage(null);

    const validation = validateForm(adminTestimonialFormSchema, {
      quote,
      customerName,
      location,
      context,
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
      await saveAdminTestimonial({
        data: {
          id: testimonial?.id ?? "new",
          ...validation.data,
        },
      });
      setSavedMessage("Saved");
      onSaved();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save testimonial");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <AdminField
        label="Quote"
        htmlFor={`quote-${testimonial?.id ?? "new"}`}
        required
        error={fieldErrors.quote}
      >
        <Textarea
          id={`quote-${testimonial?.id ?? "new"}`}
          value={quote}
          onChange={(e) => {
            setQuote(e.target.value);
            setSavedMessage(null);
          }}
          rows={4}
          className={cn("resize-none", invalidInputClass(fieldErrors.quote))}
        />
      </AdminField>

      <div className="grid sm:grid-cols-2 gap-4">
        <AdminField
          label="Customer name"
          htmlFor={`name-${testimonial?.id ?? "new"}`}
          required
          error={fieldErrors.customerName}
        >
          <Input
            id={`name-${testimonial?.id ?? "new"}`}
            value={customerName}
            onChange={(e) => {
              setCustomerName(e.target.value);
              setSavedMessage(null);
            }}
            className={`h-11 ${invalidInputClass(fieldErrors.customerName)}`}
          />
        </AdminField>

        <AdminField
          label="Location"
          htmlFor={`location-${testimonial?.id ?? "new"}`}
          required
          error={fieldErrors.location}
        >
          <Input
            id={`location-${testimonial?.id ?? "new"}`}
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setSavedMessage(null);
            }}
            className={`h-11 ${invalidInputClass(fieldErrors.location)}`}
          />
        </AdminField>
      </div>

      <AdminField
        label="Service or occasion"
        htmlFor={`context-${testimonial?.id ?? "new"}`}
        required
        error={fieldErrors.context}
      >
        <Input
          id={`context-${testimonial?.id ?? "new"}`}
          value={context}
          onChange={(e) => {
            setContext(e.target.value);
            setSavedMessage(null);
          }}
          placeholder="e.g. Engagement Hamper"
          className={`h-11 ${invalidInputClass(fieldErrors.context)}`}
        />
      </AdminField>

      {formError ? <FormErrorBanner message={formError} /> : null}

      <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3">
        <Button
          type="submit"
          className="h-11 min-w-[130px]"
          disabled={loading || (!isDirty && !!testimonial)}
        >
          {loading ? "Saving…" : testimonial ? "Save changes" : "Add testimonial"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" className="h-11" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <AdminSaveStatus message={!isDirty ? savedMessage : null} />
      </div>
    </form>
  );
}
