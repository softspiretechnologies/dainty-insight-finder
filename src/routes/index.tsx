import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { categories, galleryImages } from "@/data/products";
import { site, siteUrl, whatsappLink } from "@/lib/site";
import momentSaveTheDate from "@/assets/moment-savethedate.jpg";
import momentBirthday from "@/assets/moment-birthday.jpg";
import momentProposal from "@/assets/moment-proposal.jpg";
import momentCouple from "@/assets/moment-couple.jpg";
import momentReel from "@/assets/moment-reel.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DaintyHand — Handcrafted Gifts & Wedding Studio" },
      { name: "description", content: "Custom hampers, nikah invitations, save-the-date shoots, proposal setups & memory reels — handcrafted by Nafisa in Perinthalmanna. We ship across India & worldwide." },
      { name: "keywords", content: "Wedding Gifts India, Nikah Invitations, Save The Date Shoots, Custom Hampers India, Proposal Setup, Birthday Surprise, Wedding Invitations, Handcrafted Gifts Worldwide, Perinthalmanna gifting studio" },
      { property: "og:title", content: "DaintyHand — Handcrafted Gifts & Wedding Studio" },
      { property: "og:description", content: "Wedding gifts, nikah invitations, save-the-date shoots & surprise setups handcrafted and shipped across India & worldwide." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: siteUrl("/") },
      { property: "og:image", content: siteUrl("/og-image.jpg") },
      { property: "og:locale", content: "en_IN" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: siteUrl("/og-image.jpg") },
    ],
    links: [{ rel: "canonical", href: siteUrl("/") }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "DaintyHand",
          description: "Handcrafted gifts, wedding essentials and celebration studio based in Kerala — shipping across India & worldwide.",
          image: siteUrl("/og-image.jpg"),
          url: siteUrl("/"),
          telephone: "+91-9999999999",
          email: "hello@daintyhand.in",
          address: { "@type": "PostalAddress", addressLocality: "Perinthalmanna", addressRegion: "Kerala", addressCountry: "IN" },
          areaServed: "India & Worldwide",
          openingHours: "Mo-Sa 10:00-19:00",
          sameAs: ["https://www.instagram.com/dainty.handd/"],
          founder: { "@type": "Person", name: "Nafisa" },
        }),
      },
    ],
  }),
  component: Index,
});

const moments = [
  { title: "Save The Date Shoots", image: momentSaveTheDate, blurb: "Styled couple shoots edited as your save-the-date film & cards." },
  { title: "Birthday Surprise Setups", image: momentBirthday, blurb: "Decor, florals and signage set up while they're away." },
  { title: "Proposal Moments", image: momentProposal, blurb: "Intimate styled setups for the moment you ask." },
  { title: "Couple Content", image: momentCouple, blurb: "Editorial portraits and pre-wedding content shoots." },
  { title: "Memory Reels", image: momentReel, blurb: "Cinematic 30–60s reels from your photos & clips." },
];

const features = [
  { t: "Handcrafted with care", d: "Every ribbon, flower and detail arranged by hand." },
  { t: "Fully personalised", d: "Every creation designed around your story." },
  { t: "Wedding specialists", d: "Trusted for engagements, nikahs and celebrations." },
  { t: "Memory makers", d: "We create experiences — not just gifts." },
  { t: "Global delivery", d: "Handcrafted in Kerala, delivered anywhere in India or abroad." },
];

function Index() {
  return (
    <PageShell>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <header className="relative pt-16 pb-24 md:pt-24 md:pb-40 overflow-hidden px-5 md:px-6 border-b border-border">
        <div className="max-w-5xl mx-auto text-center">

          {/* eyebrow + location */}
          <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-muted animate-reveal block mb-6 md:mb-8">
            {site.location}
          </span>

          {/* headline */}
          <h1
            className="font-display text-[3rem] sm:text-7xl md:text-[7rem] leading-[0.88] tracking-tighter mb-8 md:mb-12 animate-reveal"
            style={{ animationDelay: "80ms" }}
          >
            Handcrafted<br />
            gifts &amp;<br />
            <span className="italic font-normal text-primary">wedding studio.</span>
          </h1>

          {/* subtext */}
          <p
            className="text-sm text-muted leading-relaxed max-w-xs mx-auto text-pretty mb-8 md:mb-12 animate-reveal"
            style={{ animationDelay: "160ms" }}
          >
            Handcrafted in Perinthalmanna.<br />
            Shipped across India &amp; worldwide.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row gap-3 justify-center animate-reveal"
            style={{ animationDelay: "240ms" }}
          >
            <a
              href={whatsappLink(`Hi ${site.founder}, I'd like to enquire about a custom order.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-4 bg-foreground text-background px-7 py-4 rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-primary transition-all active:scale-95 group"
            >
              Enquire on WhatsApp
              <span className="w-5 h-px bg-background/40 group-hover:w-8 transition-all" />
            </a>
            <Link
              to="/catalog"
              className="inline-flex items-center justify-center gap-3 border border-foreground/30 px-7 py-4 rounded-full text-xs font-semibold uppercase tracking-widest hover:border-foreground hover:bg-surface transition-all"
            >
              View Creations
            </Link>
          </div>
        </div>

        {/* decorative ribbon line */}
        <div className="absolute bottom-0 left-0 w-full h-px bg-border flex items-center overflow-hidden">
          <div className="w-48 h-px bg-primary animate-ribbon" style={{ animationDelay: "800ms" }} />
        </div>
      </header>

      {/* ── Categories grid ──────────────────────────────────── */}
      <section className="px-5 md:px-6 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 md:mb-14">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">What We Create</span>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tighter mt-3 italic text-balance">
                Eight ways to celebrate.
              </h2>
            </div>
            <Link
              to="/catalog"
              className="shrink-0 text-[10px] uppercase tracking-widest font-semibold border-b border-foreground pb-0.5 hover:text-primary hover:border-primary transition-colors self-start sm:self-auto"
            >
              View all creations →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border overflow-hidden rounded-sm">
            {categories.map((cat, i) => (
              <Link
                key={cat.id}
                to="/catalog"
                search={{ category: cat.id }}
                className="bg-background p-4 md:p-7 group hover:bg-surface transition-colors flex flex-col"
              >
                <span className="font-mono text-[9px] text-muted mb-3 md:mb-5 block">
                  ({String(i + 1).padStart(2, "0")})
                </span>
                <div className="aspect-4/5 overflow-hidden rounded-sm mb-3 md:mb-4">
                  <img
                    src={cat.image}
                    alt={cat.label}
                    width={512}
                    height={640}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <h3 className="font-display text-base md:text-xl mb-1.5 md:mb-2 italic">{cat.label}</h3>
                <p className="text-[11px] text-muted leading-relaxed hidden md:block">{cat.blurb}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why DaintyHand (horizontal scroll on mobile) ─────── */}
      <section className="border-t border-border bg-surface/40">
        <div className="max-w-7xl mx-auto px-5 md:px-6 py-12 md:py-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted block mb-8 md:mb-10">Why DaintyHand</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-border border border-border rounded-sm overflow-hidden">
            {features.map((f, i) => (
              <div key={f.t} className="bg-background p-6 md:p-8">
                <span className="font-mono text-[9px] text-primary block mb-4">0{i + 1}</span>
                <h3 className="font-display text-lg italic mb-2 leading-tight">{f.t}</h3>
                <p className="text-xs text-muted leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Moments gallery ──────────────────────────────────── */}
      <section className="py-16 md:py-24 px-5 md:px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 md:mb-14">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Beyond Gifting</span>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tighter mt-3 italic text-balance">
                Moments we captured.
              </h2>
            </div>
            <Link
              to="/services"
              className="shrink-0 text-[10px] uppercase tracking-widest font-semibold border-b border-foreground pb-0.5 hover:text-primary hover:border-primary transition-colors self-start sm:self-auto"
            >
              Explore services →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
            {moments.map((m, i) => (
              <figure
                key={m.title}
                className={`group relative overflow-hidden rounded-sm ${
                  i === 0
                    ? "col-span-2 md:col-span-2 md:row-span-2 aspect-square md:aspect-auto"
                    : "aspect-3/4"
                }`}
              >
                <img
                  src={m.image}
                  alt={m.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <figcaption className="absolute inset-0 bg-linear-to-t from-foreground/80 via-foreground/5 to-transparent flex flex-col justify-end p-3 md:p-5">
                  <h3 className="font-display italic text-background text-sm sm:text-base md:text-xl leading-tight">{m.title}</h3>
                  <p className="text-background/70 text-[11px] mt-1 hidden md:block">{m.blurb}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-5 md:px-6 bg-foreground text-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-background/50 block mb-3">How It Works</span>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl italic leading-tight">
                A simple,<br className="hidden md:block" /> considered process.
              </h2>
            </div>
            <a
              href={whatsappLink(`Hi ${site.founder}, I'd like to start a custom order.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-4 bg-primary text-background px-7 py-4 rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95 self-start md:self-auto"
            >
              Start now
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-px bg-background/10">
            {[
              { t: "Share your idea", d: "Message on WhatsApp with the occasion, vibe and budget." },
              { t: "We design", d: "We send mood boards, materials and a custom quote within 24 hours." },
              { t: "Approve & confirm", d: "Approve the design, confirm with advance, we begin handcrafting." },
              { t: "Delivery", d: "Hand-delivered locally or shipped anywhere in India & worldwide." },
            ].map((s, i) => (
              <div key={s.t} className="bg-foreground p-7 md:p-10 border-border">
                <span className="font-mono text-[10px] text-primary block mb-5">Step 0{i + 1}</span>
                <h3 className="font-display italic text-xl md:text-2xl mb-3 leading-tight">{s.t}</h3>
                <p className="text-xs text-background/60 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Credibility stats ────────────────────────────────── */}
      <section className="py-16 md:py-24 px-5 md:px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border rounded-sm overflow-hidden">
            {[
              { n: "500+", l: "Happy Customers" },
              { n: "4 yrs", l: "Of Handcrafting" },
              { n: "1,000+", l: "Pieces Created" },
              { n: "Worldwide", l: "Orders Delivered" },
            ].map((s) => (
              <div key={s.l} className="bg-background min-w-0 px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-12">
                <div className="font-display text-2xl sm:text-3xl md:text-5xl text-primary italic leading-none mb-2 md:mb-3 wrap-break-word">
                  {s.n}
                </div>
                <div className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-muted leading-snug">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gallery ──────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-5 md:px-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-10 md:mb-16">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-background/50 block mb-3">Recent Creations</span>
              <h2 className="font-display text-3xl sm:text-4xl italic text-balance">
                Hampers, bouquets, shoots &amp; more.
              </h2>
            </div>
            <a
              href={site.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-block text-[10px] uppercase tracking-[0.2em] border-b border-background/30 pb-1 hover:border-background self-start md:self-auto"
            >
              View more on Instagram
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
            <div className="space-y-3 md:space-y-6">
              <GalleryImg img={galleryImages[0]} aspect="aspect-[4/5]" />
              <GalleryImg img={galleryImages[1]} aspect="aspect-[4/3]" />
            </div>
            <div className="space-y-3 md:space-y-6 pt-10 md:pt-20">
              <GalleryImg img={galleryImages[2]} aspect="aspect-[2/3]" />
              <GalleryImg img={galleryImages[3]} aspect="aspect-square" />
            </div>
            <div className="hidden md:block space-y-6">
              <GalleryImg img={galleryImages[4]} aspect="aspect-[4/3]" />
              <GalleryImg img={galleryImages[5]} aspect="aspect-[4/5]" />
            </div>
          </div>

          <div className="mt-8 text-center md:hidden">
            <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-[0.2em] border-b border-background/30 pb-1">
              View more on Instagram
            </a>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-5 md:px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 md:mb-16">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Testimonials</span>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tighter mt-3 italic">
                Loved by our customers.
              </h2>
            </div>
            <a
              href={whatsappLink(`Hi ${site.founder}, I'd like to enquire about a custom order.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-[10px] uppercase tracking-widest font-semibold border-b border-foreground pb-0.5 hover:text-primary hover:border-primary transition-colors self-start sm:self-auto"
            >
              Become our next story →
            </a>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-sm overflow-hidden">
            {[
              { q: "DaintyHand created the most beautiful engagement hamper exactly how we imagined.", n: "Aisha & Rayan", l: "Dubai, UAE", s: "Engagement Hamper" },
              { q: "Everything was customised perfectly and delivered on time.", n: "Fathima", l: "Bengaluru", s: "Wedding Invitations" },
              { q: "Our save-the-date shoot came out beautifully — every frame felt like us.", n: "Hana & Adil", l: "Kochi", s: "Save The Date Shoot" },
              { q: "The birthday surprise setup exceeded expectations. Everyone was speechless.", n: "Saleem", l: "Perinthalmanna", s: "Birthday Surprise" },
            ].map((t) => (
              <figure key={t.n} className="bg-background p-6 md:p-8 flex flex-col">
                <div className="text-primary tracking-widest text-xs mb-5" aria-label="5 out of 5 stars">★★★★★</div>
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

      {/* ── Closing CTA ──────────────────────────────────────── */}
      <section className="py-20 md:py-32 px-5 md:px-6 bg-foreground text-background">
        <div className="max-w-5xl mx-auto">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-background/50 block mb-5">Ready to begin?</span>
          <h2 className="font-display text-[2.5rem] sm:text-6xl md:text-7xl italic leading-[0.9] tracking-tighter mb-10 md:mb-14 text-balance">
            Every gift starts with <span className="text-primary">your story.</span>
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={whatsappLink(`Hi ${site.founder}, I'd like to start a custom order.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-4 bg-primary text-background px-8 py-4 rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95 group"
            >
              Start on WhatsApp
              <span className="w-5 h-px bg-background/40 group-hover:w-8 transition-all" />
            </a>
            <Link
              to="/catalog"
              className="inline-flex items-center justify-center gap-4 border border-background/30 px-8 py-4 rounded-full text-xs font-semibold uppercase tracking-widest hover:border-background transition-all"
            >
              Browse Creations
            </Link>
          </div>
        </div>
      </section>

    </PageShell>
  );
}

function GalleryImg({ img, aspect }: { img: (typeof galleryImages)[number]; aspect: string }) {
  return (
    <div className={`w-full ${aspect} overflow-hidden rounded-sm`}>
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
