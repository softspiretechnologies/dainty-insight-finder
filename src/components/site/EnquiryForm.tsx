import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert } from "lucide-react";
import { useCallback, useEffect, useId, useState, type ReactNode } from "react";
import { useForm, type FieldErrors, type SubmitErrorHandler } from "react-hook-form";
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

/** Customer-visible fields in form order. Never includes the honeypot. */
const CUSTOMER_FIELD_ORDER = [
  "name",
  "phone",
  "eventType",
  "eventDate",
  "budget",
  "email",
  "message",
] as const;

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
    formState: { errors, isSubmitting, isSubmitted },
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

  const focusFirstInvalidField = useCallback(
    (fieldErrors: FieldErrors<FormValues>) => {
      const first = CUSTOMER_FIELD_ORDER.find((name) => fieldErrors[name]);
      if (!first) return;
      const el = document.getElementById(`${formId}-${first}`);
      if (!(el instanceof HTMLElement)) return;

      let reduced = false;
      try {
        reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      } catch {
        reduced = false;
      }
      el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      el.focus({ preventScroll: true });
    },
    [formId],
  );

  const onInvalid: SubmitErrorHandler<FormValues> = useCallback(
    (fieldErrors) => {
      setServerError(null);
      requestAnimationFrame(() => focusFirstInvalidField(fieldErrors));
    },
    [focusFirstInvalidField],
  );

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
  }, onInvalid);

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
  const visibleErrorCount = CUSTOMER_FIELD_ORDER.filter((name) => errors[name]).length;
  const showValidationSummary = isSubmitted && visibleErrorCount > 0;
  const validationSummary =
    visibleErrorCount === 1
      ? "Please check the highlighted field below."
      : "Please check the highlighted fields.";

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
        <FieldLabel htmlFor={`${formId}-name`} required invalid={Boolean(errors.name)}>
          Name
        </FieldLabel>
        <Input
          id={`${formId}-name`}
          autoComplete="name"
          aria-required="true"
          {...register("name")}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? `${formId}-name-error` : undefined}
        />
        <FieldError id={`${formId}-name-error`} message={errors.name?.message} />
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor={`${formId}-phone`} required invalid={Boolean(errors.phone)}>
          WhatsApp number
        </FieldLabel>
        <Input
          id={`${formId}-phone`}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="9876543210"
          aria-required="true"
          {...register("phone")}
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={errors.phone ? `${formId}-phone-error` : undefined}
        />
        <FieldError id={`${formId}-phone-error`} message={errors.phone?.message} />
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
          <Label
            htmlFor={`${formId}-eventDate`}
            className={cn(errors.eventDate && "text-destructive")}
          >
            Event date (optional)
          </Label>
          <Input
            id={`${formId}-eventDate`}
            type="date"
            {...register("eventDate")}
            aria-invalid={errors.eventDate ? true : undefined}
            aria-describedby={errors.eventDate ? `${formId}-eventDate-error` : undefined}
          />
          <FieldError id={`${formId}-eventDate-error`} message={errors.eventDate?.message} />
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
          <Label htmlFor={`${formId}-email`} className={cn(errors.email && "text-destructive")}>
            Email (optional)
          </Label>
          <Input
            id={`${formId}-email`}
            type="email"
            autoComplete="email"
            {...register("email")}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? `${formId}-email-error` : undefined}
          />
          <FieldError id={`${formId}-email-error`} message={errors.email?.message} />
        </div>
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor={`${formId}-message`} required invalid={Boolean(errors.message)}>
          What are you looking for?
        </FieldLabel>
        <Textarea
          id={`${formId}-message`}
          rows={4}
          className="min-h-28 text-base md:text-sm"
          aria-required="true"
          {...register("message")}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? `${formId}-message-error` : undefined}
        />
        <FieldError id={`${formId}-message-error`} message={errors.message?.message} />
      </div>

      {showValidationSummary ? (
        <p
          className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
          role="alert"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{validationSummary}</span>
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="min-h-11 w-full rounded-full">
        {isSubmitting ? "Sending…" : "Send enquiry"}
      </Button>
    </form>
  );
}

function FieldLabel({
  htmlFor,
  required,
  invalid,
  children,
}: {
  htmlFor: string;
  required?: boolean;
  invalid?: boolean;
  children: ReactNode;
}) {
  return (
    <Label htmlFor={htmlFor} className={cn(invalid && "text-destructive")}>
      {children}
      {required ? (
        <span className="text-destructive ml-0.5" aria-hidden="true">
          *
        </span>
      ) : null}
    </Label>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="flex items-start gap-1.5 text-sm text-destructive">
      <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{message}</span>
    </p>
  );
}
