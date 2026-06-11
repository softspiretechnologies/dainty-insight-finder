import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { categories, galleryImages } from "@/data/products";
import { site, whatsappLink } from "@/lib/site";
import hampersImg from "@/assets/service-hampers.jpg";
import portraitImg from "@/assets/portrait-nafisa.jpg";
import momentSaveTheDate from "@/assets/moment-savethedate.jpg";
import momentBirthday from "@/assets/moment-birthday.jpg";
import momentProposal from "@/assets/moment-proposal.jpg";
import momentCouple from "@/assets/moment-couple.jpg";
import momentReel from "@/assets/moment-reel.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DaintyHand Kerala — Wedding Gifts, Nikah Invitations & Save The Date Shoots" },
      { name: "description", content: "Custom hampers Kerala, nikah & wedding invitations Kerala, save the date shoots, proposal setups, birthday surprises and memory reels — handcrafted by Nafisa in Perinthalmanna, Malappuram." },
      { name: "keywords", content: "Wedding Gifts Kerala, Nikah Invitations Kerala, Save The Date Shoots Kerala, Custom Hampers Kerala, Proposal Setup Kerala, Birthday Surprise Kerala, Wedding Invitations Malappuram, Perinthalmanna gifting studio" },
      { property: "og:title", content: "DaintyHand Kerala — Handcrafted gifts, invitations & celebration moments" },
      { property: "og:description", content: "Wedding gifts, nikah invitations, save the date shoots and surprise setups handcrafted across Kerala." },
      { property: "og:image", content: hampersImg },
      { name: "twitter:image", content: hampersImg },
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

function Index() {
  return (
    <PageShell>
      {/* Hero */}
      <header className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden px-5 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block font-mono text-[10px] uppercase tracking-[0.3em] mb-5 md:mb-6 animate-reveal">
            {site.location}
          </span>
          <h1 className="font-display text-[2.75rem] sm:text-6xl md:text-8xl leading-[0.95] md:leading-[0.9] tracking-tighter mb-6 md:mb-8 animate-reveal text-balance" style={{ animationDelay: "100ms" }}>
            {site.heroLine1} <span className="italic font-normal text-primary">{site.heroLine2}</span>
          </h1>
          <p className="max-w-md mx-auto text-muted text-sm leading-relaxed mb-8 md:mb-10 animate-reveal text-pretty" style={{ animationDelay: "200ms" }}>
            Custom hampers, bouquets, invitations, wedding gifts & celebration services — handcrafted in Kerala. Creating meaningful gifts, memorable celebrations and lasting impressions.
          </p>
          <div className="animate-reveal flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-center max-w-sm sm:max-w-none mx-auto" style={{ animationDelay: "300ms" }}>
            <a
              href={whatsappLink(`Hi ${site.founder}, I'd like to enquire about a custom order.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-4 bg-foreground text-background px-6 sm:px-8 py-4 rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-primary transition-all active:scale-95 group"
            >
              Enquire on WhatsApp
              <span className="w-5 h-px bg-background/40 group-hover:w-8 transition-all" />
            </a>
            <Link
              to="/catalog"
              className="inline-flex items-center justify-center gap-4 border border-foreground/30 px-6 sm:px-8 py-4 rounded-full text-xs font-semibold uppercase tracking-widest hover:border-foreground hover:bg-surface transition-all"
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
      <section className="max-w-4xl mx-auto px-5 md:px-6 py-16 md:py-24 text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">The Studio</span>
        <h2 className="font-display text-3xl sm:text-4xl md:text-6xl tracking-tighter mt-4 mb-6 md:mb-8 text-balance">
          More than gifts. <span className="italic text-primary">We create memories.</span>
        </h2>
        <p className="text-sm md:text-base text-muted leading-relaxed text-pretty max-w-2xl mx-auto mb-8">
          From <em className="italic">wedding gifts Kerala</em>, <em className="italic">nikah invitations</em> and <em className="italic">custom hampers</em> to <em className="italic">save the date shoots</em> and surprise celebrations — DaintyHand turns meaningful moments into unforgettable memories across Kerala.
        </p>
        <a
          href={whatsappLink(`Hi ${site.founder}, I'd love to know more about ${site.name}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 text-[11px] uppercase tracking-widest font-semibold border-b border-foreground pb-0.5 hover:text-primary hover:border-primary"
        >
          Start a conversation on WhatsApp →
        </a>
      </section>

      {/* Categories grid (8) */}
      <section className="max-w-7xl mx-auto px-5 md:px-6 pb-16 md:pb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border overflow-hidden rounded-sm">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              to="/catalog"
              className="bg-background p-4 md:p-8 group hover:bg-surface transition-colors flex flex-col"
            >
              <span className="font-mono text-[9px] text-muted mb-3 md:mb-6 block">
                ({String(i + 1).padStart(2, "0")})
              </span>
              <div className="aspect-[4/5] overflow-hidden rounded-sm mb-3 md:mb-5">
                <img
                  src={cat.image}
                  alt={cat.label}
                  width={512}
                  height={640}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <h3 className="font-display text-lg md:text-2xl mb-2 md:mb-3 italic">{cat.label}</h3>
              <p className="text-[11px] md:text-xs text-muted leading-relaxed">{cat.blurb}</p>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8 md:mt-10">
          <a
            href={whatsappLink(`Hi ${site.founder}, I'd like to enquire about a custom order.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-4 bg-foreground text-background px-7 py-3.5 rounded-full text-[11px] font-semibold uppercase tracking-widest hover:bg-primary transition-all"
          >
            Enquire on WhatsApp
          </a>
        </div>
      </section>

      {/* Moments We Captured */}
      <section className="py-16 md:py-24 px-5 md:px-6 bg-surface/60 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-14">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Beyond Gifting</span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-6xl tracking-tighter mt-4 italic text-balance">Moments We Captured.</h2>
            <p className="text-sm text-muted mt-4 md:mt-6 max-w-xl mx-auto">From the first yes to the surprise reveal — celebration services planned, styled and filmed across Kerala.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-5">
            {moments.map((m, i) => (
              <figure key={m.title} className={`group relative overflow-hidden ${i === 0 ? "col-span-2 md:col-span-2 md:row-span-2 aspect-square md:aspect-auto" : "aspect-[3/4]"}`}>
                <img src={m.image} alt={m.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <figcaption className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/10 to-transparent flex flex-col justify-end p-3 md:p-5">
                  <h3 className="font-display italic text-background text-base sm:text-lg md:text-2xl leading-tight">{m.title}</h3>
                  <p className="text-background/80 text-[11px] mt-1.5 hidden md:block">{m.blurb}</p>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="text-center mt-8 md:mt-12">
            <Link to="/services" className="inline-flex items-center gap-3 text-[11px] uppercase tracking-widest font-semibold border-b border-foreground pb-0.5 hover:text-primary hover:border-primary">
              Explore celebration services →
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 px-5 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">How It Works</span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tighter mt-4 italic">A simple, considered process.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border rounded-sm overflow-hidden">
            {[
              { t: "Share Your Idea", d: "Message us on WhatsApp with the occasion, vibe and budget." },
              { t: "We Design", d: "We send mood, materials and a custom quote — usually within 24 hours." },
              { t: "Approve & Confirm", d: "Approve the design, confirm with advance and we begin handcrafting." },
              { t: "Delivery", d: "Hand-delivered in Perinthalmanna or shipped across Kerala on date." },
            ].map((s, i) => (
              <div key={s.t} className="bg-background p-6 md:p-8">
                <span className="font-mono text-[10px] text-primary block mb-3 md:mb-4">Step 0{i + 1}</span>
                <h3 className="font-display italic text-xl md:text-2xl mb-2 md:mb-3">{s.t}</h3>
                <p className="text-xs text-muted leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8 md:mt-12">
            <a
              href={whatsappLink(`Hi ${site.founder}, I'd like to start a custom order.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-4 bg-foreground text-background px-8 py-4 rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-primary transition-all"
            >
              Start your order on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Credibility */}
      <section className="py-16 md:py-24 px-5 md:px-6 bg-foreground text-background">
        <div className="max-w-6xl mx-auto text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-background/60">Trusted Across Kerala</span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tighter mt-4 mb-10 md:mb-14 italic">Numbers that speak quietly.</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-background/10">
            {[
              { n: "1,100+", l: "Instagram Posts" },
              { n: "3,000+", l: "Followers" },
              { n: "Hundreds", l: "Custom Creations" },
              { n: "All Kerala", l: "Customers Served" },
            ].map((s) => (
              <div key={s.l} className="bg-foreground p-5 sm:p-8 md:p-10">
                <div className="font-display text-3xl sm:text-4xl md:text-6xl text-primary italic">{s.n}</div>
                <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-background/60 mt-2 md:mt-3">{s.l}</div>
              </div>
            ))}
          </div>
          <a
            href={site.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-12 text-[10px] uppercase tracking-[0.2em] border-b border-background/30 pb-1 hover:border-background"
          >
            Follow {site.instagramHandle} on Instagram
          </a>
        </div>
      </section>

      {/* Why choose DaintyHand */}
      <section className="py-16 md:py-24 px-5 md:px-6 bg-surface/60 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Why DaintyHand</span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tighter mt-4 italic">A different kind of studio.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-border border border-border rounded-sm overflow-hidden">
            {[
              { t: "Handcrafted with care", d: "Every ribbon, flower and detail is arranged by hand." },
              { t: "Fully personalised", d: "Every creation is designed around your story." },
              { t: "Wedding specialists", d: "Trusted for engagements, nikahs and celebrations." },
              { t: "Memory makers", d: "We create experiences — not just gifts." },
              { t: "Kerala based", d: "Serving customers across Kerala from Perinthalmanna." },
            ].map((f, i) => (
              <div key={f.t} className="bg-background p-6 md:p-8">
                <span className="font-mono text-[9px] text-muted block mb-4">0{i + 1}</span>
                <h3 className="font-display text-lg italic mb-3">{f.t}</h3>
                <p className="text-xs text-muted leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-16 md:py-24 bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-5 md:px-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-10 md:mb-16">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-background/60 block mb-3">Recent Creations</span>
              <h2 className="font-display text-3xl sm:text-4xl italic text-balance">Hampers, bouquets, shoots & more.</h2>
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">
            <div className="space-y-3 md:space-y-4">
              <GalleryImg img={galleryImages[0]} aspect="aspect-[4/5]" />
              <GalleryImg img={galleryImages[1]} aspect="aspect-[4/3]" />
            </div>
            <div className="space-y-3 md:space-y-4 pt-8 md:pt-24">
              <GalleryImg img={galleryImages[2]} aspect="aspect-[2/3]" />
              <GalleryImg img={galleryImages[3]} aspect="aspect-square" />
            </div>
            <div className="hidden md:block space-y-4">
              <GalleryImg img={galleryImages[4]} aspect="aspect-[4/3]" />
              <GalleryImg img={galleryImages[5]} aspect="aspect-[4/5]" />
            </div>
          </div>
          <div className="mt-8 text-center md:hidden">
            <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-[0.2em] border-b border-background/30 pb-1">View more on Instagram</a>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24 px-5 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Testimonials</span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tighter mt-4 italic">Loved by our customers.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
          <div className="text-center mt-12">
            <a
              href={whatsappLink(`Hi ${site.founder}, I'd like to enquire about a custom order.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 text-[11px] uppercase tracking-widest font-semibold border-b border-foreground pb-0.5 hover:text-primary hover:border-primary"
            >
              Become our next happy story →
            </a>
          </div>
        </div>
      </section>

      {/* Kerala specialties SEO strip */}
      <section className="py-14 md:py-20 px-5 md:px-6 bg-surface/60 border-y border-border">
        <div className="max-w-6xl mx-auto text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Serving All Kerala</span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-5xl tracking-tighter mt-4 mb-8 md:mb-10 italic text-balance">
            From Perinthalmanna, <span className="text-primary">for all of Kerala.</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 max-w-4xl mx-auto mb-8 md:mb-10">
            {[
              "Wedding Gifts Kerala",
              "Nikah Invitations Kerala",
              "Save The Date Shoots Kerala",
              "Custom Hampers Kerala",
              "Proposal Setups Kerala",
              "Birthday Surprises Kerala",
              "Engagement Gifts Malappuram",
              "Couple Shoots Kozhikode",
              "Memory Reels Kochi",
            ].map((k) => (
              <span key={k} className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 md:px-4 md:py-2 border border-border rounded-full bg-background text-muted">
                {k}
              </span>
            ))}
          </div>
          <a
            href={whatsappLink(`Hi ${site.founder}, I'm enquiring from Kerala about your services.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-4 bg-foreground text-background px-8 py-4 rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-primary transition-all"
          >
            Enquire on WhatsApp
          </a>
        </div>
      </section>

      {/* About strip */}
      <section className="py-16 md:py-32 px-5 md:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center text-center md:text-left">
            <div className="shrink-0">
              <img
                src={portraitImg}
                alt={`${site.founder}, founder of ${site.name}`}
                width={512}
                height={512}
                loading="lazy"
                className="size-36 md:size-48 rounded-full object-cover grayscale"
              />
            </div>
            <div>
              <h4 className="font-display text-2xl md:text-3xl mb-4 italic">From {site.founder}'s hands</h4>
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
