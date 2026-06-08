import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { categories, galleryImages } from "@/data/products";
import { site, whatsappLink } from "@/lib/site";
import hampersImg from "@/assets/service-hampers.jpg";
import bouquetsImg from "@/assets/service-bouquets.jpg";
import invitationsImg from "@/assets/service-invitations.jpg";
import engagementImg from "@/assets/service-engagement.jpg";
import portraitImg from "@/assets/portrait-nafisa.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dainty Handd — Custom hampers, bouquets & invitations in Kerala" },
      { name: "description", content: "Hand-wrapped hampers, artisanal bouquets, and bespoke invitations by Nafisa in Perinthalmanna, Malappuram." },
      { property: "og:title", content: "Dainty Handd — Custom celebrations" },
      { property: "og:description", content: "Hand-wrapped hampers, artisanal bouquets, and bespoke invitations by Nafisa in Perinthalmanna, Malappuram." },
      { property: "og:image", content: hampersImg },
      { name: "twitter:image", content: hampersImg },
    ],
  }),
  component: Index,
});

const serviceImages: Record<string, string> = {
  hampers: hampersImg,
  bouquets: bouquetsImg,
  invitations: invitationsImg,
  engagement: engagementImg,
};

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
            Your plans, <span className="italic font-normal text-primary">Our goals.</span>
          </h1>
          <p className="max-w-md mx-auto text-muted text-sm leading-relaxed mb-10 animate-reveal text-pretty" style={{ animationDelay: "200ms" }}>
            Curated celebrations by {site.founder}. Hand-wrapped hampers, artisanal bouquets, and bespoke invitations for life's most gentle moments.
          </p>
          <div className="animate-reveal" style={{ animationDelay: "300ms" }}>
            <a
              href={whatsappLink(`Hi ${site.founder}, I'd like to enquire about a custom order.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-4 bg-foreground text-background px-8 py-4 rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-primary transition-all active:scale-95 group"
            >
              Enquire on WhatsApp
              <span className="w-5 h-px bg-background/40 group-hover:w-8 transition-all" />
            </a>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-px bg-border flex justify-center items-center overflow-hidden">
          <div className="w-48 h-px bg-primary animate-ribbon" style={{ animationDelay: "800ms" }} />
        </div>
      </header>

      {/* Services grid */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-4 gap-px bg-border border border-border overflow-hidden rounded-sm">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              to="/catalog"
              className="bg-background p-10 group hover:bg-surface transition-colors"
            >
              <span className="font-mono text-[9px] text-muted mb-8 block">
                ({String(i + 1).padStart(2, "0")})
              </span>
              <h3 className="font-display text-2xl mb-4 italic">{cat.label}</h3>
              <p className="text-xs text-muted leading-relaxed mb-8">{cat.blurb}</p>
              <div className="aspect-[4/5] overflow-hidden rounded-sm mb-4">
                <img
                  src={serviceImages[cat.id]}
                  alt={cat.label}
                  width={512}
                  height={640}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Gallery */}
      <section className="py-24 bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end mb-16">
            <h2 className="font-display text-4xl italic">The Gallery</h2>
            <Link
              to="/catalog"
              className="text-[10px] uppercase tracking-[0.2em] border-b border-background/30 pb-1 hover:border-background"
            >
              View Catalog
            </Link>
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
              <h4 className="font-display text-3xl mb-4 italic">From {site.founder}'s hand</h4>
              <p className="text-sm text-muted leading-relaxed text-pretty">
                Based in Perinthalmanna, I founded {site.name} on the belief that a gift is more than an object — it's a shared memory. Every ribbon is tied by hand, and every flower is chosen for its story. We bring your plans to life with care.
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
