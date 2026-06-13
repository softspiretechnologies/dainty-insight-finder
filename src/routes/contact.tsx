import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { site, siteUrl, whatsappLink } from "@/lib/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact DaintyHand — WhatsApp, Instagram & Studio" },
      { name: "description", content: `Reach ${site.founder} at ${site.name} on WhatsApp, Instagram, or email — based in ${site.location}.` },
      { property: "og:title", content: "Contact — DaintyHand" },
      { property: "og:description", content: `Reach ${site.founder} at ${site.name} on WhatsApp, Instagram, or email — based in ${site.location}.` },
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
      <section className="px-5 md:px-6 pt-12 md:pt-20 pb-16 md:pb-32">
        <div className="max-w-3xl mx-auto">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Contact</span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl tracking-tighter mt-4 mb-8 md:mb-12 leading-[0.95] text-balance">
            Say <span className="italic text-primary">hello.</span>
          </h1>

          <p className="text-sm text-muted max-w-lg leading-relaxed mb-10 md:mb-16 text-pretty">
            We answer fastest on WhatsApp. For larger event briefs, email is fine too — we typically reply within a day.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border border border-border rounded-sm overflow-hidden">
            <ContactCard
              kind="WhatsApp"
              value="Chat with Nafisa"
              href={whatsappLink(`Hi ${site.founder}, I'd like to enquire.`)}
              primary
            />
            <ContactCard
              kind="Instagram"
              value={site.instagramHandle}
              href={site.instagramUrl}
            />
            <ContactCard
              kind="Email"
              value={site.email}
              href={`mailto:${site.email}`}
            />
            <ContactCard
              kind="Studio"
              value={site.location}
            />
          </div>

          <div className="mt-12 md:mt-16 border-t border-border pt-8">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted block mb-2">Hours</span>
            <p className="text-sm">{site.hours} · By appointment on Sundays</p>
          </div>

          <div className="mt-10 md:mt-12 border border-border rounded-sm overflow-hidden aspect-[4/3] sm:aspect-[16/9]">
            <iframe
              title="DaintyHand studio location — Perinthalmanna"
              src="https://www.google.com/maps?q=Perinthalmanna,+Malappuram,+Kerala&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full border-0"
            />
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function ContactCard({
  kind,
  value,
  href,
  primary,
}: {
  kind: string;
  value: string;
  href?: string;
  primary?: boolean;
}) {
  const inner = (
    <div className="bg-background p-6 sm:p-8 h-full flex flex-col justify-between min-h-[120px] sm:min-h-[140px] group">
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">{kind}</span>
      <span
        className={`font-display text-xl sm:text-2xl italic mt-4 sm:mt-6 break-words ${
          primary ? "text-primary" : ""
        } group-hover:text-primary transition-colors`}
      >
        {value}
      </span>
    </div>
  );

  if (!href) return inner;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block">
      {inner}
    </a>
  );
}