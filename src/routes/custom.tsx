import { createFileRoute } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PageShell } from "@/components/site/PageShell";
import { site, siteUrl, whatsappLink } from "@/lib/site";

const serviceOptions = [
  "Hamper",
  "Bouquet",
  "Invitation",
  "Engagement Gift",
  "Acrylic / Frame Gift",
  "Album",
  "Calligraphy",
  "Save The Date Shoot",
  "Birthday Surprise",
  "Event Styling",
  "Memory Video",
  "Other",
] as const;

const customOrderSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name"),
  phone: z
    .string()
    .trim()
    .min(10, "Enter a valid phone or WhatsApp number")
    .regex(/^\+?[\d\s-]{10,}$/, "Enter a valid phone or WhatsApp number"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .or(z.literal(""))
    .optional(),
  service: z.enum(serviceOptions),
  eventType: z.string().trim().optional(),
  date: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value) return true;
        const selected = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selected >= today;
      },
      { message: "Event date must be today or in the future" },
    ),
  budget: z.string().trim().optional(),
  location: z.string().trim().min(2, "Enter a delivery city or area"),
  notes: z
    .string()
    .trim()
    .min(10, "Add a short description so we can understand your brief"),
});

type CustomOrderForm = z.infer<typeof customOrderSchema>;

export const Route = createFileRoute("/custom")({
  head: () => ({
    meta: [
      { title: "Custom Order — DaintyHand | Tell us what you have in mind" },
      { name: "description", content: "Start a custom hamper, bouquet, invitation, engagement gift, save-the-date shoot or birthday surprise with Nafisa on WhatsApp." },
      { property: "og:title", content: "Custom Order — DaintyHand" },
      { property: "og:description", content: "Tell us what you have in mind — we'll continue the conversation on WhatsApp." },
      { property: "og:image", content: siteUrl("/og-image.jpg") },
    ],
    links: [
      { rel: "canonical", href: siteUrl("/custom") },
    ],
  }),
  component: CustomPage,
});

function CustomPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomOrderForm>({
    resolver: zodResolver(customOrderSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      service: "Hamper",
      eventType: "",
      date: "",
      budget: "",
      location: "",
      notes: "",
    },
  });

  function buildMessage(data: CustomOrderForm) {
    const lines = [
      `Hi ${site.founder}, I'd like to start a custom order.`,
      "",
      `Name: ${data.name}`,
      `Phone / WhatsApp: ${data.phone}`,
      `Email: ${data.email || "—"}`,
      `Service: ${data.service}`,
      `Event type: ${data.eventType || "—"}`,
      `Event date: ${data.date || "—"}`,
      `Delivery location: ${data.location}`,
      `Budget: ${data.budget || "—"}`,
      `Description: ${data.notes}`,
    ];
    return lines.join("\n");
  }

  function onSubmit(data: CustomOrderForm) {
    const url = whatsappLink(buildMessage(data));
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const inputClass =
    "w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm";

  return (
    <PageShell>
      <section className="px-5 md:px-6 pt-12 md:pt-20 pb-8 md:pb-12">
        <div className="max-w-3xl mx-auto text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Custom Order</span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl tracking-tighter mt-4 mb-5 md:mb-6 text-balance">
            Tell us what you have <span className="italic text-primary">in mind.</span>
          </h1>
          <p className="text-sm text-muted leading-relaxed text-pretty max-w-lg mx-auto">
            Fill this in and we'll continue the conversation on WhatsApp — no payment, no commitment until you're happy with the plan.
          </p>
        </div>
      </section>

      <section className="px-5 md:px-6 pb-16 md:pb-32">
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="max-w-2xl mx-auto bg-surface/60 border border-border rounded-sm p-5 sm:p-8 md:p-12 space-y-6 md:space-y-8"
        >
          <Field label="Full name" error={errors.name?.message}>
            <input
              {...register("name")}
              className={inputClass}
              placeholder="Your name"
              autoComplete="name"
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
            <Field label="Phone / WhatsApp" error={errors.phone?.message}>
              <input
                {...register("phone")}
                className={inputClass}
                placeholder="+91 ..."
                autoComplete="tel"
              />
            </Field>
            <Field label="Email (optional)" error={errors.email?.message}>
              <input
                type="email"
                {...register("email")}
                className={inputClass}
                placeholder="you@email.com"
                autoComplete="email"
              />
            </Field>
          </div>

          <Field label="Service required" error={errors.service?.message}>
            <select {...register("service")} className={inputClass}>
              {serviceOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Event type (wedding, birthday, engagement…)" error={errors.eventType?.message}>
            <input
              {...register("eventType")}
              className={inputClass}
              placeholder="Engagement"
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
            <Field label="Event date" error={errors.date?.message}>
              <input type="date" {...register("date")} className={inputClass} />
            </Field>

            <Field label="Budget range (optional)" error={errors.budget?.message}>
              <input
                {...register("budget")}
                className={inputClass}
                placeholder="₹2,000–5,000"
              />
            </Field>
          </div>

          <Field label="Delivery location" error={errors.location?.message}>
            <input
              {...register("location")}
              className={inputClass}
              placeholder="City / area"
            />
          </Field>

          <Field label="Description / the brief" error={errors.notes?.message}>
            <textarea
              {...register("notes")}
              rows={5}
              className={`${inputClass} resize-none`}
              placeholder="Colours, theme, names, recipient, anything else…"
            />
          </Field>

          <p className="text-[11px] text-muted">
            Have reference images? Share them on WhatsApp once you continue — it's the easiest way to send pictures.
          </p>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-4 bg-foreground text-background px-6 sm:px-8 py-4 rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-primary transition-all active:scale-95 group"
            >
              Continue on WhatsApp
              <span className="w-5 h-px bg-background/40 group-hover:w-8 transition-all" />
            </button>
            <p className="text-[11px] text-muted mt-4">
              Opens WhatsApp with your brief pre-filled. Nothing is sent until you tap send.
            </p>
          </div>
        </form>
      </section>
    </PageShell>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted block mb-2">
        {label}
      </span>
      {children}
      {error ? <p className="text-[11px] text-destructive mt-1">{error}</p> : null}
    </label>
  );
}
