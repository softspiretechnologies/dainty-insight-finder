import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { categories, galleryImages } from "@/data/products";
import { site, whatsappLink } from "@/lib/site";
import hampersImg from "@/assets/service-hampers.jpg";
import portraitImg from "@/assets/portrait-nafisa.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DaintyHand — Premium handcrafted gifts & wedding studio, Kerala" },
      { name: "description", content: "Custom hampers, bouquets, invitations, engagement gifts and celebration services handcrafted by Nafisa in Perinthalmanna, Kerala." },
      { property: "og:title", content: "DaintyHand — Handcrafted gifts & celebration studio" },
      { property: "og:description", content: "Custom hampers, bouquets, invitations, engagement gifts and celebration services handcrafted in Kerala." },
      { property: "og:image", content: hampersImg },
      { name: "twitter:image", content: hampersImg },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <PageShell>
      {/* Hero */}
      <header className="relative pt-20 pb-32 overflow-hidden px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block font-mono text-[10px] uppercase tracking-[0.3em] mb-6 animate-reveal">
            {site.location}
          </span>
          <h1 className="font-display text-5xl md:text-8xl leading-[0.9] tracking-tighter mb-8 animate-reveal text-balance" style={{ animationDelay: "100ms" }}>
            {site.heroLine1} <span className="italic font-normal text-primary">{site.heroLine2}</span>
          </h1>
          <p className="max-w-md mx-auto text-muted text-sm leading-relaxed mb-10 animate-reveal text-pretty" style={{ animationDelay: "200ms" }}>
            Custom hampers, bouquets, invitations, wedding gifts & celebration services — handcrafted in Kerala. Creating meaningful gifts, memorable celebrations and lasting impressions.
          </p>
          <div className="animate-reveal flex flex-wrap gap-4 justify-center" style={{ animationDelay: "300ms" }}>
            <a
              href={whatsappLink(`Hi ${site.founder}, I'd like to enquire about a custom order.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-4 bg-foreground text-background px-8 py-4 rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-primary transition-all active:scale-95 group"
            >
              Enquire on WhatsApp
              <span className="w-5 h-px bg-background/40 group-hover:w-8 transition-all" />
            </a>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-4 border border-foreground/30 px-8 py-4 rounded-full text-xs font-semibold uppercase tracking-widest hover:border-foreground hover:bg-surface transition-all"
            >
              View Our Creations
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-px bg-border flex justify-center items-center overflow-hidden">
          <div className="w-48 h-px bg-primary animate-ribbon" style={{ animationDelay: "800ms" }} />
        </div>
      </header>

      {/* More than gifts */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">The Studio</span>
        <h2 className="font-display text-4xl md:text-6xl tracking-tighter mt-4 mb-8 text-balance">
          More than gifts. <span className="italic text-primary">We create memories.</span>
        </h2>
        <p className="text-sm md:text-base text-muted leading-relaxed text-pretty max-w-2xl mx-auto">
          From handcrafted hampers and bouquets to save-the-date shoots and surprise celebrations, DaintyHand helps turn meaningful moments into unforgettable memories.
        </p>
      </section>

      {/* Categories grid (8) */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border overflow-hidden rounded-sm">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              to="/catalog"
              className="bg-background p-6 md:p-8 group hover:bg-surface transition-colors flex flex-col"
            >
              <span className="font-mono text-[9px] text-muted mb-6 block">
                ({String(i + 1).padStart(2, "0")})
              </span>
              <div className="aspect-[4/5] overflow-hidden rounded-sm mb-5">
                <img
                  src={cat.image}
                  alt={cat.label}
                  width={512}
                  height={640}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <h3 className="font-display text-xl md:text-2xl mb-3 italic">{cat.label}</h3>
              <p className="text-xs text-muted leading-relaxed">{cat.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Why choose DaintyHand */}
      <section className="py-24 px-6 bg-surface/60 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Why DaintyHand</span>
            <h2 className="font-display text-4xl md:text-5xl tracking-tighter mt-4 italic">A different kind of studio.</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-px bg-border border border-border rounded-sm overflow-hidden">
            {[
              { t: "Handcrafted with care", d: "Every ribbon, flower and detail is arranged by hand." },
              { t: "Fully personalised", d: "Every creation is designed around your story." },
              { t: "Wedding specialists", d: "Trusted for engagements, nikahs and celebrations." },
              { t: "Memory makers", d: "We create experiences — not just gifts." },
              { t: "Kerala based", d: "Serving customers across Kerala from Perinthalmanna." },
            ].map((f, i) => (
              <div key={f.t} className="bg-background p-8">
                <span className="font-mono text-[9px] text-muted block mb-4">0{i + 1}</span>
                <h3 className="font-display text-lg italic mb-3">{f.t}</h3>
                <p className="text-xs text-muted leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-24 bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end mb-16">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-background/60 block mb-3">Recent Creations</span>
              <h2 className="font-display text-4xl italic">Hampers, bouquets, shoots & more.</h2>
            </div>
            <a
              href={site.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-block text-[10px] uppercase tracking-[0.2em] border-b border-background/30 pb-1 hover:border-background"
            >
              View more on Instagram
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <GalleryImg img={galleryImages[0]} aspect="aspect-[4/5]" />
              <GalleryImg img={galleryImages[1]} aspect="aspect-[4/3]" />
            </div>
            <div className="space-y-4 pt-12 md:pt-24">
              <GalleryImg img={galleryImages[2]} aspect="aspect-[2/3]" />
              <GalleryImg img={galleryImages[3]} aspect="aspect-square" />
            </div>
            <div className="hidden md:block space-y-4">
              <GalleryImg img={galleryImages[4]} aspect="aspect-[4/3]" />
              <GalleryImg img={galleryImages[5]} aspect="aspect-[4/5]" />
            </div>
          </div>
          <div className="mt-12 text-center md:hidden">
            <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-[0.2em] border-b border-background/30 pb-1">View more on Instagram</a>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Testimonials</span>
            <h2 className="font-display text-4xl md:text-5xl tracking-tighter mt-4 italic">Loved by our customers.</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { q: "DaintyHand created the most beautiful engagement hamper exactly how we imagined.", n: "Aisha & Rayan", l: "Malappuram", s: "Engagement Hamper" },
              { q: "Everything was customised perfectly and delivered on time.", n: "Fathima", l: "Kozhikode", s: "Wedding Invitations" },
              { q: "Our save-the-date shoot came out beautifully — every frame felt like us.", n: "Hana & Adil", l: "Kochi", s: "Save The Date Shoot" },
              { q: "The birthday surprise setup exceeded expectations. Everyone was speechless.", n: "Saleem", l: "Perinthalmanna", s: "Birthday Surprise" },
            ].map((t) => (
              <figure key={t.n} className="border border-border rounded-sm p-6 bg-background flex flex-col">
                <div className="text-primary tracking-widest text-sm mb-4" aria-label="5 out of 5 stars">★★★★★</div>
                <blockquote className="font-display italic text-base leading-relaxed mb-6 flex-1">
                  "{t.q}"
                </blockquote>
                <figcaption className="border-t border-border pt-4">
                  <div className="text-sm font-medium">{t.n}</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted mt-1">{t.l} · {t.s}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* About strip */}
      <section className="py-32 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="shrink-0">
              <img
                src={portraitImg}
                alt={`${site.founder}, founder of ${site.name}`}
                width={512}
                height={512}
                loading="lazy"
                className="size-48 rounded-full object-cover grayscale"
              />
            </div>
            <div>
              <h4 className="font-display text-3xl mb-4 italic">From {site.founder}'s hands</h4>
              <p className="text-sm text-muted leading-relaxed text-pretty">
                Based in Perinthalmanna, I founded {site.name} on the belief that a gift is more than an object — it's a memory. From hampers and invitations to engagement setups and save-the-date shoots, every creation is assembled around your story.
              </p>
              <Link
                to="/about"
                className="inline-block mt-6 text-[10px] uppercase tracking-[0.2em] font-semibold border-b border-foreground pb-0.5 hover:text-primary hover:border-primary transition-colors"
              >
                Read our story
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function GalleryImg({ img, aspect }: { img: (typeof galleryImages)[number]; aspect: string }) {
  return (
    <div className={`w-full ${aspect} overflow-hidden`}>
      <img
        src={img.src}
        alt={img.alt}
        width={img.w}
        height={img.h}
        loading="lazy"
        className="w-full h-full object-cover"
      />
    </div>
  );
}
