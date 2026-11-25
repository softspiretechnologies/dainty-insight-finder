import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { siteUrl } from "@/lib/site";
import { listPublishedBlogPosts } from "@/lib/api/blog";

export const Route = createFileRoute("/blog/")({
  loader: () => listPublishedBlogPosts(),
  head: () => ({
    meta: [
      { title: "Journal & Gifting Guides — DaintyHand Kerala" },
      {
        name: "description",
        content:
          "Gift hamper ordering guides, bouquet ideas, Nikah invitations, engagement keepsakes and celebration inspiration from DaintyHand in Kerala.",
      },
      { property: "og:title", content: "Journal & Gifting Guides — DaintyHand Kerala" },
      {
        property: "og:description",
        content:
          "Inspiration, gift hamper ideas, wedding Nikah invitation design guides, and celebration shoot locations in Kerala from DaintyHand.",
      },
      { property: "og:url", content: siteUrl("/blog") },
      { property: "og:image", content: siteUrl("/og-image.jpg") },
    ],
    links: [{ rel: "canonical", href: siteUrl("/blog") }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "DaintyHand Journal",
          description:
            "Gifting inspiration, wedding guides, and celebration styling ideas in Kerala.",
          url: siteUrl("/blog"),
          publisher: {
            "@type": "Organization",
            name: "DaintyHand",
            logo: siteUrl("/og-image.jpg"),
          },
        }),
      },
    ],
  }),
  component: BlogIndexPage,
});

function BlogIndexPage() {
  const blogPosts = Route.useLoaderData();
  return (
    <PageShell>
      <section className="px-5 md:px-6 pt-12 md:pt-20 pb-8 md:pb-12">
        <div className="max-w-4xl mx-auto text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
            The Journal
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl tracking-tighter mt-4 mb-5 md:mb-6 text-balance">
            Ideas, inspiration &amp; <span className="italic text-primary">gifting guides.</span>
          </h1>
          <p className="text-sm md:text-base text-muted leading-relaxed max-w-2xl mx-auto text-pretty">
            Explore practical guides on custom hampers, bouquets, Nikah invitations, engagement
            keepsakes and celebration ideas in Kerala.
          </p>
        </div>
      </section>

      <section className="px-5 md:px-6 pb-16 md:pb-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="bg-surface/50 border border-border rounded-sm p-6 flex flex-col justify-between group hover:border-foreground/30 transition-all"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted mb-4">
                  <span className="text-primary">{post.category}</span>
                  <span>{post.readTime}</span>
                </div>
                <Link to="/blog/$slug" params={{ slug: post.slug }}>
                  <h2 className="break-words font-display text-xl sm:text-2xl italic leading-tight mb-3 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                </Link>
                <p className="text-xs text-muted leading-relaxed mb-6 line-clamp-3">
                  {post.excerpt}
                </p>
              </div>

              <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-[10px] text-muted">{post.date}</span>
                <Link
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="text-[10px] uppercase tracking-widest font-semibold border-b border-foreground pb-0.5 group-hover:border-primary group-hover:text-primary transition-colors"
                >
                  Read guide →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
