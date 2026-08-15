import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSiteContact } from "@/hooks/useSiteContact";
import { trackEvent } from "@/lib/analytics";
import { submitEnquiry } from "@/lib/api/enquiries";
import { EVENT_TYPE_OPTIONS, publicEnquirySchema, type EnquirySource } from "@/lib/enquiries";
import { cn } from "@/lib/utils";

const formSchema = publicEnquirySchema.omit({ website: true }).extend({
  website: z.string().optional(),
});

type FormValues = z.input<typeof formSchema>;

export type EnquiryFormProps = {
  source: EnquirySource;
  productId?: number;
  productSlug?: string;
  productName?: string;
  serviceId?: string;
  serviceTitle?: string;
  className?: string;
  onOpened?: () => void;
};

export function EnquiryForm({
  source,
  productId,
  productSlug,
  productName,
  serviceId,
  serviceTitle,
  className,
  onOpened,
}: EnquiryFormProps) {
  const { waLink } = useSiteContact();
  const formId = useId();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ whatsappMessage: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      eventType: "",
      eventDate: "",
      budget: "",
      message: "",
      source,
      productId,
      productSlug,
      serviceId,
      website: "",
    },
  });

  useEffect(() => {
    trackEvent("enquiry_form_opened", {
      enquiry_source: source,
      product_slug: productSlug,
      source_page: source,
    });
    onOpened?.();
  }, [onOpened, productSlug, source]);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const result = await submitEnquiry({
        data: {
          ...values,
          source,
          productId,
          productSlug,
          serviceId,
          website: values.website ?? "",
        },
      });
      setSuccess({ whatsappMessage: result.whatsappMessage });
      trackEvent("enquiry_submitted", {
        enquiry_source: source,
        product_slug: productSlug,
        source_page: source,
      });
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "We could not save your enquiry. Please try again.",
      );
    }
  });

  if (success) {
    const continueHref = waLink(success.whatsappMessage);
    return (
      <div className={cn("space-y-5", className)} role="status">
        <div className="rounded-sm border border-border bg-surface/40 p-5">
          <p className="font-display text-2xl italic">Enquiry sent</p>
          <p className="text-sm text-muted mt-2 leading-relaxed">
            Thank you. We saved your details and will follow up soon. You can continue the
            conversation on WhatsApp now if you prefer.
          </p>
        </div>
        <a
          href={continueHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackEvent("enquiry_whatsapp_clicked", {
              enquiry_source: source,
              product_slug: productSlug,
              source_page: source,
            })
          }
          className="inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-full bg-foreground px-6 py-3 text-center text-xs font-semibold uppercase tracking-widest text-background hover:bg-primary transition-colors"
        >
          Continue on WhatsApp
        </a>
      </div>
    );
  }

  const interest = productName || serviceTitle ? `About ${productName || serviceTitle}` : null;

  return (
    <form onSubmit={onSubmit} className={cn("relative space-y-4", className)} noValidate>
      {interest ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">{interest}</p>
      ) : null}

      {serverError ? (
        <p className="text-sm text-destructive" role="alert">
          {serverError}
        </p>
      ) : null}

      {/* Honeypot */}
      <div
        className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden"
        aria-hidden="true"
      >
        <label htmlFor={`${formId}-website`}>Company website</label>
        <input id={`${formId}-website`} tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${formId}-name`}>Name</Label>
        <Input
          id={`${formId}-name`}
          autoComplete="name"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? `${formId}-name-error` : undefined}
          {...register("name")}
        />
        {errors.name ? (
          <p id={`${formId}-name-error`} className="text-xs text-destructive">
            {errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${formId}-phone`}>WhatsApp number</Label>
        <Input
          id={`${formId}-phone`}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="9876543210"
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={errors.phone ? `${formId}-phone-error` : undefined}
          {...register("phone")}
        />
        {errors.phone ? (
          <p id={`${formId}-phone-error`} className="text-xs text-destructive">
            {errors.phone.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${formId}-eventType`}>Event type (optional)</Label>
          <select
            id={`${formId}-eventType`}
            className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 text-base md:text-sm"
            {...register("eventType")}
          >
            <option value="">Select</option>
            {EVENT_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${formId}-eventDate`}>Event date (optional)</Label>
          <Input id={`${formId}-eventDate`} type="date" {...register("eventDate")} />
          {errors.eventDate ? (
            <p className="text-xs text-destructive">{errors.eventDate.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${formId}-budget`}>Approx. budget (optional)</Label>
          <Input
            id={`${formId}-budget`}
            placeholder="e.g. ₹5,000 – ₹10,000"
            {...register("budget")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${formId}-email`}>Email (optional)</Label>
          <Input
            id={`${formId}-email`}
            type="email"
            autoComplete="email"
            aria-invalid={errors.email ? true : undefined}
            {...register("email")}
          />
          {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${formId}-message`}>What are you looking for?</Label>
        <Textarea
          id={`${formId}-message`}
          rows={4}
          className="min-h-28 text-base md:text-sm"
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? `${formId}-message-error` : undefined}
          {...register("message")}
        />
        {errors.message ? (
          <p id={`${formId}-message-error`} className="text-xs text-destructive">
            {errors.message.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={isSubmitting} className="min-h-11 w-full rounded-full">
        {isSubmitting ? "Sending…" : "Send enquiry"}
      </Button>
    </form>
  );
}
