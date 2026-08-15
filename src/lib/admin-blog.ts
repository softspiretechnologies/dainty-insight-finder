export type AdminBlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export function toIsoDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  return null;
}

export function parseAdminBlogPostId(postId: string): number | "new" | null {
  if (postId === "new") return "new";
  const id = Number(postId);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

export function serializeAdminBlogPost(row: {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean | number;
  publishedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}): AdminBlogPost {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    featuredImage: row.featuredImage,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    isPublished: Boolean(row.isPublished),
    publishedAt: toIsoDate(row.publishedAt),
    createdAt: toIsoDate(row.createdAt),
    updatedAt: toIsoDate(row.updatedAt),
  };
}
