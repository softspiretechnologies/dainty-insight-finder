import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { getServicesPageDataFn } from "@/lib/api/catalog";
import { siteUrl } from "@/lib/site";
import { useSiteContact } from "@/hooks/useSiteContact";

export const Route = createFileRoute("/services")({
  loader: () => getServicesPageDataFn(),
  head: ({ loaderData }) => {
    const intro =
      loaderData?.intro ??
      "Save-the-date shoots, proposal setups, birthday surprises, couple shoots and memory reels — styled by DaintyHand across India & worldwide.";

    return {
      meta: [
        { title: "Celebration Services — DaintyHand | Shoots & Event Styling" },
        { name: "description", content: intro },
        { name: "keywords", content: "Save The Date Shoots, Proposal Setup, Birthday Surprise, Couple Shoot, Memory Reels, Wedding Studio Malappuram, Perinthalmanna celebrations, Event Styling India" },
        { property: "og:title", content: "Celebration Services — DaintyHand" },
        { property: "og:description", content: intro },
        { property: "og:url", content: siteUrl("/services") },
        { property: "og:image", content: siteUrl("/og-image.jpg") },
      ],
      links: [{ rel: "canonical", href: siteUrl("/services") }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@graph":
              loaderData?.services.map((service) => ({
                "@type": "Service",
                name: service.title,
                description: service.blurb,
                provider: { "@type": "LocalBusiness", name: "DaintyHand" },
                areaServed: "India & Worldwide",
                serviceType: service.title,
              })) ?? [],
          }),
        },
      ],
    };
  },
  component: ServicesPage,
});

function ServicesPage() {
  const { intro, footerTitle, footerBlurb, services } = Route.useLoaderData();
  const { waLink, founder } = useSiteContact();

  return (
    <PageShell>
      <section className="px-5 md:px-6 pt-12 md:pt-20 pb-8 md:pb-12">
        <div className="max-w-4xl mx-auto text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Celebration Services</span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl tracking-tighter mt-4 mb-5 md:mb-6 text-balance">
            We don't just make gifts. <span className="italic text-primary">We create moments.</span>
          </h1>
          <p className="text-sm md:text-base text-muted leading-relaxed max-w-2xl mx-auto text-pretty">{intro}</p>
        </div>
      </section>

      <section className="px-5 md:px-6 pb-16 md:pb-24">
        <div className="max-w-6xl mx-auto space-y-14 md:space-y-24">
          {services.map((s, i) => (
            <article key={s.id} className={`grid md:grid-cols-2 gap-6 md:gap-12 items-center ${i % 2 ? "md:[direction:rtl]" : ""}`}>
              <div className="aspect-4/3 overflow-hidden bg-surface md:[direction:ltr]">
                <OptimizedImage
                  src={s.image}
                  alt={s.title}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority={i === 0}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="md:[direction:ltr]">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">0{i + 1}</span>
                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl italic mt-3 mb-4 md:mb-5">{s.title}</h2>
                <p className="text-sm text-muted leading-relaxed mb-6 text-pretty">{s.blurb}</p>
                <ul className="space-y-2 mb-8 border-t border-border pt-4">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex gap-3 text-sm">
                      <span className="font-mono text-[10px] text-muted pt-1">·</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={waLink(`Hi ${founder}, I'd like to enquire about ${s.title}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 text-[11px] uppercase tracking-widest font-semibold border-b border-foreground pb-0.5 hover:text-primary hover:border-primary"
                >
                  Enquire on WhatsApp →
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 md:px-6 pb-16 md:pb-24">
        <div className="max-w-3xl mx-auto text-center border-t border-border pt-12 md:pt-16">
          <h2 className="font-display text-2xl md:text-3xl italic mb-4">{footerTitle}</h2>
          <p className="text-sm text-muted mb-8 leading-relaxed">{footerBlurb}</p>
          <Link
            to="/custom"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-4 bg-foreground text-background px-6 sm:px-8 py-4 rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-primary transition-all active:scale-95 group"
          >
            Start a custom enquiry
            <span className="w-5 h-px bg-background/40 group-hover:w-8 transition-all" />
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
