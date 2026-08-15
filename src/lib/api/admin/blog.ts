import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/index.server";
import { blogPosts } from "@/db/schema";
import { serializeAdminBlogPost } from "@/lib/admin-blog";
import { adminBlogPostSchema } from "@/lib/admin-schemas";
import { requireAdmin } from "@/lib/auth.server";
import { clearDataCache } from "@/lib/data.server";
import { logError } from "@/lib/logger.server";

function isDuplicateKeyError(error: unknown) {
  return error instanceof Error && /duplicate|unique/i.test(error.message);
}

const BLOG_TABLE_ERROR =
  "Blog posts could not be loaded. The blog_posts table may be missing — run npm run db:ensure.";

export const listAdminBlogPosts = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  try {
    const rows = await getDb().select().from(blogPosts).orderBy(desc(blogPosts.updatedAt));
    return { posts: rows.map(serializeAdminBlogPost) };
  } catch (error) {
    logError("admin.blog.list_failed", error);
    return { posts: [], error: BLOG_TABLE_ERROR };
  }
});

export const getAdminBlogPost = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    try {
      const rows = await getDb().select().from(blogPosts).where(eq(blogPosts.id, data.id)).limit(1);
      return rows[0] ? serializeAdminBlogPost(rows[0]) : null;
    } catch (error) {
      logError("admin.blog.get_failed", error, { id: data.id });
      throw new Error(BLOG_TABLE_ERROR);
    }
  });

export const saveAdminBlogPost = createServerFn({ method: "POST" })
  .validator(adminBlogPostSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = getDb();
    const id = data.id === "new" ? undefined : data.id;
    const existing = id
      ? (await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1))[0]
      : undefined;
    const values = {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      featuredImage: data.featuredImage || null,
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
      isPublished: data.isPublished,
      publishedAt: data.isPublished ? (existing?.publishedAt ?? new Date()) : null,
    };

    try {
      if (id) {
        await db.update(blogPosts).set(values).where(eq(blogPosts.id, id));
        clearDataCache();
        return { id };
      }
      const result = await db.insert(blogPosts).values(values);
      const header = Array.isArray(result) ? result[0] : result;
      clearDataCache();
      return { id: Number((header as { insertId?: number }).insertId) };
    } catch (error) {
      if (isDuplicateKeyError(error)) throw new Error("A blog post with this slug already exists.");
      logError("admin.blog.save_failed", error);
      throw new Error(BLOG_TABLE_ERROR);
    }
  });

export const toggleAdminBlogPost = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int().positive(), published: z.boolean() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    await getDb()
      .update(blogPosts)
      .set({ isPublished: data.published, publishedAt: data.published ? new Date() : null })
      .where(eq(blogPosts.id, data.id));
    clearDataCache();
    return { ok: true as const };
  });

export const deleteAdminBlogPost = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    await getDb().delete(blogPosts).where(eq(blogPosts.id, data.id));
    clearDataCache();
    return { ok: true as const };
  });
