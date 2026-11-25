import { eq } from "drizzle-orm";

import { getDb, isDatabaseConfigured } from "@/db/index.server";
import { blogPosts, categories, products } from "@/db/schema";
import { blogPosts as staticBlogPosts } from "@/data/blog";
import { categories as staticCategories, products as staticProducts } from "@/data/products";
import { buildSitemapEntries } from "@/lib/sitemap";

/** Do not reuse public-catalog error fallbacks for the sitemap. */
export async function getSitemapEntries() {
  if (!isDatabaseConfigured()) {
    if (process.env.NODE_ENV === "production") throw new Error("Sitemap database not configured");
    return buildSitemapEntries(
      staticProducts,
      staticBlogPosts,
      staticCategories.map((category) => category.id),
    );
  }

  const db = getDb();
  const [productRows, categoryRows, blogRows] = await Promise.all([
    db
      .select({ slug: products.slug, category: products.categoryId, updatedAt: products.updatedAt })
      .from(products)
      .where(eq(products.isActive, true)),
    db.select({ id: categories.id }).from(categories),
    db
      .select({
        slug: blogPosts.slug,
        isPublished: blogPosts.isPublished,
        updatedAt: blogPosts.updatedAt,
      })
      .from(blogPosts),
  ]);
  // Unpublished database rows shadow seed posts with the same slug.
  const databaseSlugs = new Set(blogRows.map((post) => post.slug));
  const published = [
    ...blogRows.filter((post) => post.isPublished),
    ...staticBlogPosts.filter((post) => !databaseSlugs.has(post.slug)),
  ];
  return buildSitemapEntries(
    productRows,
    published,
    categoryRows.map((category) => category.id),
  );
}
