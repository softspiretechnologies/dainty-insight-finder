import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { site, whatsappLink } from "@/lib/site";
import portraitImg from "@/assets/portrait-nafisa.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "From Nafisa's Hands — About DaintyHand" },
      { name: "description", content: `${site.name} is a premium handcrafted gifting, wedding & celebration studio by ${site.founder} in ${site.location}.` },
      { property: "og:title", content: "From Nafisa's Hands — About DaintyHand" },
      { property: "og:description", content: `${site.name} is a premium handcrafted gifting, wedding & celebration studio by ${site.founder} in ${site.location}.` },
      { property: "og:image", content: portraitImg },
      { name: "twitter:image", content: portraitImg },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PageShell>
      <section className="px-6 pt-20 pb-32">
        <div className="max-w-3xl mx-auto">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Our Story</span>
          <h1 className="font-display text-5xl md:text-7xl tracking-tighter mt-4 mb-12 leading-[0.95] text-balance">
            From {site.founder}'s <span className="italic text-primary">hands.</span>
          </h1>

          <div className="aspect-[5/3] overflow-hidden mb-16">
            <img
              src={portraitImg}
              alt={`${site.founder} in her studio`}
              width={1024}
              height={614}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="prose-like space-y-6 text-base leading-relaxed text-foreground/85">
            <p>
              {site.name} began with a simple belief: a gift should be more than an object. It should become a memory.
            </p>
            <p>
              Based in Perinthalmanna, {site.name} creates handcrafted gifts, invitations, keepsakes and celebration experiences designed around each customer's story — from custom hampers and bouquets to engagement setups, save-the-date shoots and birthday surprises.
            </p>
            <p>
              From intimate celebrations to grand wedding events, every creation is thoughtfully assembled with attention to detail, creativity and personal care.
            </p>
          </div>

          <div className="mt-20 grid sm:grid-cols-3 gap-8 border-t border-border pt-12">
            <Fact label="Based in" value={site.location} />
            <Fact label="Started" value="2019" />
            <Fact label="Pieces shipped" value="1,000+" />
          </div>

          <div className="mt-20 text-center">
            <Link
              to="/custom"
              className="inline-flex items-center gap-4 bg-foreground text-background px-8 py-4 rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-primary transition-all active:scale-95 group"
            >
              Start a custom order
              <span className="w-5 h-px bg-background/40 group-hover:w-8 transition-all" />
            </Link>
            <p className="text-[11px] text-muted mt-4">
              Or message us directly on{" "}
              <a
                className="text-primary hover:underline"
                href={whatsappLink(`Hi ${site.founder}, I saw your story page.`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted block mb-2">{label}</span>
      <span className="font-display text-2xl italic">{value}</span>
    </div>
  );
}