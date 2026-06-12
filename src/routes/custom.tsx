import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/site/PageShell";
import { site, whatsappLink } from "@/lib/site";

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
];

export const Route = createFileRoute("/custom")({
  head: () => ({
    meta: [
      { title: "Custom Order — DaintyHand | Tell us what you have in mind" },
      { name: "description", content: "Start a custom hamper, bouquet, invitation, engagement gift, save-the-date shoot or birthday surprise with Nafisa on WhatsApp." },
      { property: "og:title", content: "Custom Order — DaintyHand" },
      { property: "og:description", content: "Tell us what you have in mind — we'll continue the conversation on WhatsApp." },
    ],
    links: [
      { rel: "canonical", href: "https://dainty-insight-finder.lovable.app/custom" },
    ],
  }),
  component: CustomPage,
});

function CustomPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [eventType, setEventType] = useState("");
  const [service, setService] = useState<string>("Hamper");
  const [date, setDate] = useState("");
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  function buildMessage() {
    const lines = [
      `Hi ${site.founder}, I'd like to start a custom order.`,
      "",
      `Name: ${name || "—"}`,
      `Phone / WhatsApp: ${phone || "—"}`,
      `Email: ${email || "—"}`,
      `Service: ${service}`,
      `Event type: ${eventType || "—"}`,
      `Event date: ${date || "—"}`,
      `Delivery location: ${location || "—"}`,
      `Budget: ${budget || "—"}`,
      `Description: ${notes || "—"}`,
    ];
    return lines.join("\n");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = whatsappLink(buildMessage());
    window.open(url, "_blank", "noopener,noreferrer");
  }

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
          onSubmit={onSubmit}
          className="max-w-2xl mx-auto bg-surface/60 border border-border rounded-sm p-5 sm:p-8 md:p-12 space-y-6 md:space-y-8"
        >
          <Field label="Full name">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm"
              placeholder="Your name"
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
            <Field label="Phone / WhatsApp">
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm"
                placeholder="+91 ..."
              />
            </Field>
            <Field label="Email (optional)">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm"
                placeholder="you@email.com"
              />
            </Field>
          </div>

          <Field label="Service required">
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm"
            >
              {serviceOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Event type (wedding, birthday, engagement…)">
            <input
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm"
              placeholder="Engagement"
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
            <Field label="Event date">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm"
              />
            </Field>

            <Field label="Budget range (optional)">
              <input
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm"
                placeholder="₹2,000–5,000"
              />
            </Field>
          </div>

          <Field label="Delivery location">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm"
              placeholder="City / area"
            />
          </Field>

          <Field label="Description / the brief">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm resize-none"
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted block mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}