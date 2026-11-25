import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Category } from "@/data/products";
import { site, siteUrl } from "@/lib/site";
import { businessReference } from "@/lib/business-seo";
import { serializeCatalogJsonLd } from "@/lib/catalog-seo";
import { useSiteContact } from "@/hooks/useSiteContact";
import { trackEvent } from "@/lib/analytics";
import { useEffect } from "react";
import { getPublishedBlogPost } from "@/lib/api/blog";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = await getPublishedBlogPost({ data: { slug: params.slug } });
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post;
    if (!post) {
      return { meta: [{ title: "Post not found — DaintyHand" }] };
    }
    const url = siteUrl(`/blog/${post.slug}`);
    return {
      meta: [
        { title: post.metaTitle || `${post.title} — DaintyHand Journal` },
        { name: "description", content: post.metaDescription || post.excerpt },
        { name: "keywords", content: post.targetKeyword },
        { property: "og:title", content: `${post.title} — DaintyHand Journal` },
        { property: "og:description", content: post.excerpt },
        { property: "og:url", content: url },
        {
          property: "og:image",
          content: post.image.startsWith("http") ? post.image : siteUrl(post.image),
        },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: serializeCatalogJsonLd({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.excerpt,
            url,
            datePublished: post.datePublished || post.date,
            image: post.image.startsWith("http") ? post.image : siteUrl(post.image),
            author: { "@type": "Person", name: post.author },
            publisher: businessReference(),
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
          }),
        },
      ],
    };
  },
  component: BlogPostPage,
  notFoundComponent: () => (
    <PageShell>
      <div className="max-w-3xl mx-auto px-6 py-32 text-center">
        <h1 className="font-display text-5xl italic mb-4">Article not found</h1>
        <Link
          to="/blog"
          className="text-[11px] uppercase tracking-widest font-semibold border-b border-foreground pb-0.5"
        >
          Back to Journal
        </Link>
      </div>
    </PageShell>
  ),
});

function BlogPostPage() {
  const { post } = Route.useLoaderData();
  const { waLink, founder } = useSiteContact();

  useEffect(() => {
    trackEvent("blog_view", { source_page: post.slug });
  }, [post.slug]);

  return (
    <PageShell>
      <article className="px-5 md:px-6 pt-12 md:pt-20 pb-16 md:pb-24">
        <div className="max-w-3xl mx-auto">
          <Link
            to="/blog"
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted hover:text-primary inline-block mb-6 md:mb-10"
          >
            ← Back to Journal
          </Link>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted mb-4">
            <span className="text-primary">{post.category}</span>
            <span>·</span>
            <span>{post.date}</span>
            <span>·</span>
            <span>{post.readTime}</span>
          </div>

          <h1 className="break-words font-display text-3xl sm:text-5xl md:text-6xl tracking-tighter leading-[0.95] mb-8 text-balance">
            {post.title}
          </h1>

          <div className="border-t border-b border-border py-4 mb-10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-muted">
            <span>Written by {post.author}</span>
            <span>Handcrafted in Perinthalmanna, Kerala</span>
          </div>

          <div className="space-y-6 break-words text-sm sm:text-base text-foreground/90 leading-relaxed font-body">
            {post.content.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-12 p-6 sm:p-8 bg-surface/60 border border-border rounded-sm text-center">
            <h2 className="font-display text-2xl italic mb-3">
              Planning a wedding or custom gift in Kerala?
            </h2>
            <p className="text-xs text-muted mb-6 max-w-md mx-auto">
              Tell {founder} what you have in mind and we'll craft a bespoke solution tailored to
              your occasion and budget.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={waLink(
                  `Hi ${founder}, I read your article on "${post.title}" and would like to discuss a custom order.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-4 bg-foreground text-background px-7 py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-primary transition-all active:scale-95 group"
              >
                Discuss on WhatsApp
                <span className="w-5 h-px bg-background/40 group-hover:w-8 transition-all" />
              </a>
              {post.relatedCategorySlug ? (
                <Link
                  to="/catalog"
                  search={{ category: post.relatedCategorySlug as Category }}
                  className="inline-flex items-center justify-center gap-3 border border-border px-7 py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest hover:border-foreground hover:bg-surface transition-all"
                >
                  Browse Related Creations
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </article>
    </PageShell>
  );
}
