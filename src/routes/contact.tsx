import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { site, siteUrl, whatsappLink } from "@/lib/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact DaintyHand — WhatsApp, Instagram & Studio" },
      { name: "description", content: `Reach ${site.founder} at ${site.name} on WhatsApp, Instagram, or email — based in ${site.location}.` },
      { property: "og:title", content: "Contact — DaintyHand" },
      { property: "og:description", content: `Reach ${site.founder} at ${site.name} on WhatsApp, Instagram, or email — based in ${site.location}.` },
      { property: "og:image", content: siteUrl("/og-image.jpg") },
    ],
    links: [
      { rel: "canonical", href: siteUrl("/contact") },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <PageShell>
      {/* Hero */}
      <section className="px-5 md:px-6 pt-12 md:pt-20 pb-12 md:pb-20 border-b border-border">
        <div className="max-w-4xl mx-auto">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Get in touch</span>
          <h1 className="font-display text-[2.75rem] sm:text-6xl md:text-8xl leading-[0.95] tracking-tighter mt-4 mb-6 text-balance">
            Say <span className="italic text-primary">hello.</span>
          </h1>
          <p className="text-sm text-muted max-w-sm leading-relaxed text-pretty">
            We're fastest on WhatsApp. For a detailed brief, email works too — we reply within a day.
          </p>
        </div>
      </section>

      {/* Primary contact channels */}
      <section className="px-5 md:px-6 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border rounded-sm overflow-hidden">

            {/* WhatsApp — primary */}
            <a
              href={whatsappLink(`Hi ${site.founder}, I'd like to enquire.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-foreground text-background p-8 md:p-12 flex flex-col justify-between min-h-[200px] md:min-h-[240px]"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-background/50">WhatsApp</span>
              <div>
                <p className="font-display text-2xl md:text-3xl italic text-primary mb-2">Chat with {site.founder}</p>
                <p className="text-[11px] text-background/60 uppercase tracking-[0.2em]">Usually replies within hours →</p>
              </div>
            </a>

            {/* Instagram */}
            <a
              href={site.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-background p-8 md:p-12 flex flex-col justify-between min-h-[200px] md:min-h-[240px] hover:bg-surface transition-colors"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Instagram</span>
              <div>
                <p className="font-display text-2xl md:text-3xl italic group-hover:text-primary transition-colors mb-2">{site.instagramHandle}</p>
                <p className="text-[11px] text-muted uppercase tracking-[0.2em]">DM us for inspiration & enquiries →</p>
              </div>
            </a>

            {/* Email */}
            <a
              href={`mailto:${site.email}`}
              className="group bg-background p-8 md:p-12 flex flex-col justify-between min-h-[160px] hover:bg-surface transition-colors"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Email</span>
              <div>
                <p className="font-display text-xl md:text-2xl italic group-hover:text-primary transition-colors mb-2">{site.email}</p>
                <p className="text-[11px] text-muted uppercase tracking-[0.2em]">For detailed event briefs →</p>
              </div>
            </a>

            {/* Studio */}
            <div className="bg-surface/60 p-8 md:p-12 flex flex-col justify-between min-h-[160px]">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Studio</span>
              <div>
                <p className="font-display text-xl md:text-2xl italic mb-2">{site.location}</p>
                <p className="text-[11px] text-muted uppercase tracking-[0.2em]">By appointment only</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Delivery strip */}
      <section className="px-5 md:px-6 pb-16 md:pb-32 bg-surface/40 border-t border-border py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 md:mb-10">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Delivery & Shipping</span>
            <h2 className="font-display text-2xl md:text-3xl italic mt-3 text-balance">
              Handcrafted here, <span className="text-primary">delivered anywhere.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border border border-border rounded-sm overflow-hidden">
            {[
              {
                n: "01",
                heading: "Perinthalmanna & Malappuram",
                body: "Hand-delivered locally — we set up, arrange and hand over in person.",
              },
              {
                n: "02",
                heading: "Anywhere in India",
                body: "Carefully packed and couriered to your door. Available for all states.",
              },
              {
                n: "03",
                heading: "International Orders",
                body: "We ship worldwide. Weddings abroad, NRI gifts, global celebrations welcome.",
              },
            ].map((item) => (
              <div key={item.n} className="bg-background p-6 md:p-8">
                <span className="font-mono text-[9px] text-muted block mb-4">{item.n}</span>
                <h3 className="font-display italic text-lg mb-3">{item.heading}</h3>
                <p className="text-xs text-muted leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <a
              href={whatsappLink(`Hi ${site.founder}, I'd like to enquire about delivery to my location.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 text-[11px] uppercase tracking-widest font-semibold border-b border-foreground pb-0.5 hover:text-primary hover:border-primary transition-colors"
            >
              Ask about delivery →
            </a>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-5 md:px-6 py-16 md:py-24 bg-foreground text-background">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-background/50 block mb-4">Ready to begin?</span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl italic leading-tight text-balance">
              Start with a <span className="text-primary">message.</span>
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <a
              href={whatsappLink(`Hi ${site.founder}, I'd like to start a custom order.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-4 bg-primary text-background px-7 py-4 rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95"
            >
              WhatsApp us
            </a>
            <Link
              to="/custom"
              className="inline-flex items-center justify-center gap-4 border border-background/30 px-7 py-4 rounded-full text-xs font-semibold uppercase tracking-widest hover:border-background transition-all"
            >
              Custom order form
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
