import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/index.server";
import { blogPosts } from "@/db/schema";
import { adminBlogPostSchema } from "@/lib/admin-schemas";
import { requireAdmin } from "@/lib/auth.server";

function isDuplicateKeyError(error: unknown) {
  return error instanceof Error && /duplicate|unique/i.test(error.message);
}

export const listAdminBlogPosts = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return getDb().select().from(blogPosts).orderBy(desc(blogPosts.updatedAt));
});

export const getAdminBlogPost = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const rows = await getDb().select().from(blogPosts).where(eq(blogPosts.id, data.id)).limit(1);
    return rows[0] ?? null;
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
        return { id };
      }
      const result = await db.insert(blogPosts).values(values);
      const header = Array.isArray(result) ? result[0] : result;
      return { id: Number((header as { insertId?: number }).insertId) };
    } catch (error) {
      if (isDuplicateKeyError(error)) throw new Error("A blog post with this slug already exists.");
      throw error;
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
    return { ok: true as const };
  });

export const deleteAdminBlogPost = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    await getDb().delete(blogPosts).where(eq(blogPosts.id, data.id));
    return { ok: true as const };
  });
