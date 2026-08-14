import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";

import { AdminField, FormErrorBanner } from "@/components/admin/AdminField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminBlogPostSchema } from "@/lib/admin-schemas";
import { getAdminBlogPost, saveAdminBlogPost } from "@/lib/api/admin/blog";

export const Route = createFileRoute("/admin/blog/$postId")({
  loader: async ({ params }) => ({
    post:
      params.postId === "new"
        ? null
        : await getAdminBlogPost({ data: { id: Number(params.postId) } }),
  }),
  component: AdminBlogEditor,
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function AdminBlogEditor() {
  const { post } = Route.useLoaderData();
  const { postId } = Route.useParams();
  const router = useRouter();
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [featuredImage, setFeaturedImage] = useState(post?.featuredImage ?? "");
  const [metaTitle, setMetaTitle] = useState(post?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription ?? "");
  const [isPublished, setIsPublished] = useState(post?.isPublished ?? false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = adminBlogPostSchema.safeParse({
      id: postId === "new" ? "new" : Number(postId),
      title,
      slug,
      excerpt,
      content,
      featuredImage: featuredImage || undefined,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      isPublished,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form fields");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveAdminBlogPost({ data: parsed.data });
      await router.navigate({ to: "/admin/blog" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to save post");
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <Link to="/admin/blog" className="inline-flex items-center gap-1 text-xs text-muted mb-5">
        <ChevronLeft className="w-4 h-4" /> Blog
      </Link>
      <h1 className="font-display text-3xl md:text-5xl italic mb-7">
        {post ? "Edit post" : "New post"}
      </h1>
      <form onSubmit={submit} className="space-y-5">
        <AdminField label="Title" htmlFor="title" required>
          <Input
            id="title"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (!post) setSlug(slugify(event.target.value));
            }}
          />
        </AdminField>
        <AdminField label="Slug" htmlFor="slug" required>
          <Input
            id="slug"
            value={slug}
            onChange={(event) => setSlug(slugify(event.target.value))}
          />
        </AdminField>
        <AdminField label="Excerpt" htmlFor="excerpt" required>
          <Textarea
            id="excerpt"
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
            rows={3}
          />
        </AdminField>
        <AdminField
          label="Content"
          htmlFor="content"
          required
          hint="Separate paragraphs with a blank line."
        >
          <Textarea
            id="content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={14}
          />
        </AdminField>
        <AdminField
          label="Featured image URL"
          htmlFor="featuredImage"
          hint="Optional existing /uploads path or absolute URL."
        >
          <Input
            id="featuredImage"
            value={featuredImage}
            onChange={(event) => setFeaturedImage(event.target.value)}
          />
        </AdminField>
        <AdminField label="SEO title" htmlFor="metaTitle">
          <Input
            id="metaTitle"
            value={metaTitle}
            onChange={(event) => setMetaTitle(event.target.value)}
          />
        </AdminField>
        <AdminField label="SEO description" htmlFor="metaDescription">
          <Textarea
            id="metaDescription"
            value={metaDescription}
            onChange={(event) => setMetaDescription(event.target.value)}
            rows={3}
          />
        </AdminField>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(event) => setIsPublished(event.target.checked)}
          />
          Published
        </label>
        {error ? <FormErrorBanner message={error} /> : null}
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save post"}
        </Button>
      </form>
    </div>
  );
}
