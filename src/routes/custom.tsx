import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/site/PageShell";
import { categories } from "@/data/products";
import { site, whatsappLink } from "@/lib/site";

export const Route = createFileRoute("/custom")({
  head: () => ({
    meta: [
      { title: "Custom Order — Dainty Handd" },
      { name: "description", content: "Start a custom hamper, bouquet, invitation or engagement gift with Nafisa on WhatsApp." },
      { property: "og:title", content: "Custom Order — Dainty Handd" },
      { property: "og:description", content: "Start a custom hamper, bouquet, invitation or engagement gift with Nafisa on WhatsApp." },
    ],
  }),
  component: CustomPage,
});

function CustomPage() {
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("hampers");
  const [date, setDate] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");

  function buildMessage() {
    const lines = [
      `Hi ${site.founder}, I'd like to start a custom order.`,
      "",
      `Name: ${name || "—"}`,
      `Type: ${categories.find((c) => c.id === type)?.label ?? type}`,
      `Event date: ${date || "—"}`,
      `Budget: ${budget || "—"}`,
      `Notes: ${notes || "—"}`,
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
      <section className="px-6 pt-20 pb-12">
        <div className="max-w-3xl mx-auto text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Custom Order</span>
          <h1 className="font-display text-5xl md:text-7xl tracking-tighter mt-4 mb-6 text-balance">
            Tell us what you have <span className="italic text-primary">in mind.</span>
          </h1>
          <p className="text-sm text-muted leading-relaxed text-pretty max-w-lg mx-auto">
            Fill this in and we'll continue the conversation on WhatsApp — no payment, no commitment until you're happy with the plan.
          </p>
        </div>
      </section>

      <section className="px-6 pb-32">
        <form
          onSubmit={onSubmit}
          className="max-w-2xl mx-auto bg-surface/60 border border-border rounded-sm p-8 md:p-12 space-y-8"
        >
          <Field label="Your name">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm"
              placeholder="Nafisa"
            />
          </Field>

          <Field label="What kind of piece?">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
              <option value="other">Something else</option>
            </select>
          </Field>

          <div className="grid sm:grid-cols-2 gap-8">
            <Field label="Event date">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm"
              />
            </Field>

            <Field label="Budget (optional)">
              <input
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm"
                placeholder="₹2,000–5,000"
              />
            </Field>
          </div>

          <Field label="The brief">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm resize-none"
              placeholder="Colours, theme, names, recipient, anything else…"
            />
          </Field>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-4 bg-foreground text-background px-8 py-4 rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-primary transition-all active:scale-95 group"
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