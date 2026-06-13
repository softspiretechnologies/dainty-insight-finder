import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { site, siteUrl, whatsappLink } from "@/lib/site";
import shootImg from "@/assets/service-invitations.jpg";
import proposalImg from "@/assets/moment-proposal.jpg";
import coupleImg from "@/assets/moment-couple.jpg";
import savedateImg from "@/assets/moment-savethedate.jpg";
import reelImg from "@/assets/moment-reel.jpg";
import birthdaySetupImg from "@/assets/moment-birthday.jpg";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Celebration Services — DaintyHand | Shoots & Event Styling" },
      { name: "description", content: "Save-the-date shoots, proposal setups, birthday surprises, couple shoots and memory reels — styled by DaintyHand across India & worldwide." },
      { name: "keywords", content: "Save The Date Shoots, Proposal Setup, Birthday Surprise, Couple Shoot, Memory Reels, Wedding Studio Malappuram, Perinthalmanna celebrations, Event Styling India" },
      { property: "og:title", content: "Celebration Services — DaintyHand" },
      { property: "og:description", content: "Save the date shoots, proposals, surprises, couple shoots and memory reels across India & worldwide." },
      { property: "og:url", content: siteUrl("/services") },
      { property: "og:image", content: shootImg },
    ],
    links: [
      { rel: "canonical", href: siteUrl("/services") },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            "Save The Date Shoots",
            "Birthday Surprise Planning",
            "Proposal Setups",
            "Couple Shoots",
            "Memory Reels",
            "Event Styling",
          ].map((name) => ({
            "@type": "Service",
            name,
            provider: { "@type": "LocalBusiness", name: "DaintyHand" },
            areaServed: "India & Worldwide",
            serviceType: name,
          })),
        }),
      },
    ],
  }),
  component: ServicesPage,
});

const services = [
  {
    title: "Save The Date Shoots",
    image: savedateImg,
    blurb:
      "A 1–2 hour styled couple shoot, edited as a save-the-date film with matching cards. Locations across India — Perinthalmanna, Kozhikode, Kochi, Bengaluru, Dubai and beyond.",
    bullets: ["Styled couple shoot", "Edited reel + stills", "Save-the-date card design", "Packages from ₹12,000"],
  },
  {
    title: "Birthday Surprise Planning",
    image: birthdaySetupImg,
    blurb:
      "Decor concept, balloons, florals, signage and styled cake table — set up at home or venue while the guest of honour is away.",
    bullets: ["Decor + florals + signage", "Cake table styling", "Optional hamper add-on", "Packages from ₹4,500"],
  },
  {
    title: "Proposal Setups",
    image: proposalImg,
    blurb:
      "A private styled setup — florals, candles, signage, ring tray and an optional reel — for proposals at home, terrace or venue.",
    bullets: ["Styled florals & candles", "Custom signage", "Ring tray & hamper option", "Reel video add-on"],
  },
  {
    title: "Couple Shoots",
    image: coupleImg,
    blurb:
      "Editorial pre-wedding and anniversary couple shoots — softly styled, candid, and edited in our warm signature tone.",
    bullets: ["Styled outdoor / indoor shoot", "Wardrobe & prop guidance", "25+ edited portraits", "Reel highlight add-on"],
  },
  {
    title: "Reels & Memory Videos",
    image: reelImg,
    blurb:
      "Short reels and edited videos from your photos and clips — for birthdays, anniversaries, engagement surprises and couple stories.",
    bullets: ["30–60s cinematic reels", "Birthday & anniversary edits", "Engagement & couple videos", "From ₹1,500"],
  },
];

function ServicesPage() {
  return (
    <PageShell>
      <section className="px-5 md:px-6 pt-12 md:pt-20 pb-8 md:pb-12">
        <div className="max-w-4xl mx-auto text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Celebration Services</span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl tracking-tighter mt-4 mb-5 md:mb-6 text-balance">
            We don't just make gifts. <span className="italic text-primary">We create moments.</span>
          </h1>
          <p className="text-sm md:text-base text-muted leading-relaxed max-w-2xl mx-auto text-pretty">
            From save-the-date shoots and birthday surprises to proposal styling and edited memory videos — every service is planned around your story.
          </p>
        </div>
      </section>

      <section className="px-5 md:px-6 pb-16 md:pb-24">
        <div className="max-w-6xl mx-auto space-y-14 md:space-y-24">
          {services.map((s, i) => (
            <article key={s.title} className={`grid md:grid-cols-2 gap-6 md:gap-12 items-center ${i % 2 ? "md:[direction:rtl]" : ""}`}>
              <div className="aspect-[4/3] overflow-hidden bg-surface md:[direction:ltr]">
                <img src={s.image} alt={s.title} loading="lazy" className="w-full h-full object-cover" />
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
                  href={whatsappLink(`Hi ${site.founder}, I'd like to enquire about ${s.title}.`)}
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
          <h2 className="font-display text-2xl md:text-3xl italic mb-4">Planning something else?</h2>
          <p className="text-sm text-muted mb-8 leading-relaxed">
            We also style proposals, nikahs, couple shoots and intimate celebrations. Tell us what you have in mind.
          </p>
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