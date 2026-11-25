import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { EnquirySheet } from "@/components/site/EnquirySheet";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { getServicesPageDataFn } from "@/lib/api/catalog";
import { siteUrl } from "@/lib/site";
import { businessReference } from "@/lib/business-seo";
import { serializeCatalogJsonLd } from "@/lib/catalog-seo";
import { useSiteContact } from "@/hooks/useSiteContact";

export const Route = createFileRoute("/services")({
  loader: () => getServicesPageDataFn(),
  head: ({ loaderData }) => {
    const serviceGraph =
      loaderData?.services.map((service) => ({
        "@type": "Service",
        name: service.title,
        description: service.blurb,
        provider: businessReference(),
        areaServed: ["Malappuram", "Kozhikode", "Kerala"],
        serviceType: service.title,
      })) ?? [];

    return {
      meta: [
        { title: "Save The Date Shoots, Proposal Setups & Birthday Surprises - DaintyHand" },
        {
          name: "description",
          content:
            "Professional celebration services in Malappuram & Kerala: save-the-date couple shoots, surprise birthday setups, proposal styling and cinematic memory reels.",
        },
        {
          name: "keywords",
          content:
            "Save The Date Shoots Kozhikode, Proposal Setup Kerala, Birthday Surprise Malappuram, Couple Shoot Perinthalmanna, Memory Reels Kerala, Event Styling",
        },
        {
          property: "og:title",
          content: "Save The Date Shoots, Proposal Setups & Birthday Surprises - DaintyHand",
        },
        {
          property: "og:description",
          content:
            "Professional celebration services in Malappuram & Kerala: save-the-date couple shoots, surprise birthday setups, proposal styling and cinematic memory reels.",
        },
        { property: "og:url", content: siteUrl("/services") },
        { property: "og:image", content: siteUrl("/og-image.jpg") },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: siteUrl("/services") }],
      scripts: [
        {
          type: "application/ld+json",
          children: serializeCatalogJsonLd({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: siteUrl("/") },
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: "Services",
                    item: siteUrl("/services"),
                  },
                ],
              },
              ...serviceGraph,
            ],
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
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
            Celebration Services
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl tracking-tighter mt-4 mb-5 md:mb-6 text-balance">
            We don't just make gifts.{" "}
            <span className="italic text-primary">We create moments.</span>
          </h1>
          <p className="text-sm md:text-base text-muted leading-relaxed max-w-2xl mx-auto text-pretty">
            {intro}
          </p>
        </div>
      </section>

      <section className="px-5 md:px-6 pb-16 md:pb-24">
        <div className="max-w-6xl mx-auto space-y-14 md:space-y-24">
          {services.map((s, i) => (
            <article
              key={s.id}
              className={`grid md:grid-cols-2 gap-6 md:gap-12 items-center ${i % 2 ? "md:[direction:rtl]" : ""}`}
            >
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
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
                  0{i + 1}
                </span>
                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl italic mt-3 mb-4 md:mb-5">
                  {s.title}
                </h2>
                <p className="text-sm text-muted leading-relaxed mb-6 text-pretty">{s.blurb}</p>
                <ul className="space-y-2 mb-8 border-t border-border pt-4">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex gap-3 text-sm">
                      <span className="font-mono text-[10px] text-muted pt-1">·</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <EnquirySheet
                    source="service"
                    serviceId={s.id}
                    serviceTitle={s.title}
                    triggerLabel="Get a Quote"
                    triggerClassName="inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-foreground px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-background hover:bg-primary w-full sm:w-auto"
                  />
                  <a
                    href={waLink(`Hi ${founder}, I'd like to enquire about ${s.title}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-3 text-[11px] uppercase tracking-widest font-semibold border-b border-foreground pb-0.5 hover:text-primary hover:border-primary w-fit"
                  >
                    Or WhatsApp →
                  </a>
                </div>
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
