import { desc, eq } from "drizzle-orm";

import { blogPosts as staticBlogPosts, type BlogPost } from "@/data/blog";
import { getDb, isDatabaseConfigured } from "@/db/index.server";
import { blogPosts } from "@/db/schema";
import { toIsoDate } from "@/lib/admin-blog";
import { logError } from "@/lib/logger.server";

function mapBlogPost(row: typeof blogPosts.$inferSelect): BlogPost {
  const publishedAt = row.publishedAt ?? row.createdAt;
  const iso = toIsoDate(publishedAt);
  const displayDate = iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
  const content = row.content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  return {
    slug: row.slug,
    title: row.title,
    category: "Journal",
    readTime: `${Math.max(1, Math.ceil(row.content.split(/\s+/).length / 220))} min read`,
    author: "DaintyHand",
    date: displayDate,
    datePublished: iso ?? new Date().toISOString(),
    excerpt: row.excerpt,
    content,
    targetKeyword: "",
    image: row.featuredImage || "/og-image.jpg",
    metaTitle: row.metaTitle || undefined,
    metaDescription: row.metaDescription || undefined,
  };
}

export async function getPublishedBlogPosts() {
  if (!isDatabaseConfigured()) return staticBlogPosts;
  try {
    const rows = await getDb()
      .select()
      .from(blogPosts)
      .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.createdAt));
    const databaseSlugs = new Set(rows.map((row) => row.slug));
    const publishedDatabasePosts = rows.filter((row) => row.isPublished).map(mapBlogPost);
    const fallbackPosts = staticBlogPosts.filter((post) => !databaseSlugs.has(post.slug));
    return [...publishedDatabasePosts, ...fallbackPosts];
  } catch (error) {
    logError("blog.database_failure", error, { operation: "getPublishedBlogPosts" });
    return staticBlogPosts;
  }
}

export async function getPublishedBlogPostBySlug(slug: string) {
  if (!isDatabaseConfigured()) return staticBlogPosts.find((post) => post.slug === slug);
  try {
    const rows = await getDb().select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
    const row = rows[0];
    if (row) return row.isPublished ? mapBlogPost(row) : undefined;
    return staticBlogPosts.find((post) => post.slug === slug);
  } catch (error) {
    logError("blog.database_failure", error, { operation: "getPublishedBlogPostBySlug", slug });
    return staticBlogPosts.find((post) => post.slug === slug);
  }
}
