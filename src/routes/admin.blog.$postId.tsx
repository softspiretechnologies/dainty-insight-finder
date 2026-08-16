import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useMemo, useState } from "react";

import { AdminField, FormErrorBanner } from "@/components/admin/AdminField";
import { AdminPagePending } from "@/components/admin/AdminSkeleton";
import { AdminSaveStatus } from "@/components/admin/AdminSaveStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { parseAdminBlogPostId } from "@/lib/admin-blog";
import { adminBlogPostSchema } from "@/lib/admin-schemas";
import { getAdminBlogPost, saveAdminBlogPost } from "@/lib/api/admin/blog";

export const Route = createFileRoute("/admin/blog/$postId")({
  loader: async ({ params }) => {
    const parsed = parseAdminBlogPostId(params.postId);
    if (parsed === "new" || parsed === null) return { post: null };
    return { post: await getAdminBlogPost({ data: { id: parsed } }) };
  },
  pendingComponent: () => <AdminPagePending label="Loading blog post…" />,
  errorComponent: ({ error, reset }) => (
    <div className="max-w-3xl space-y-4">
      <h1 className="font-display text-3xl italic">Blog post</h1>
      <p className="text-sm text-destructive">{error.message}</p>
      <button type="button" className="text-sm underline" onClick={reset}>
        Try again
      </button>
    </div>
  ),
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
  const isNew = !post;
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
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const isDirty = useMemo(() => {
    if (isNew) {
      return Boolean(
        title ||
        slug ||
        excerpt ||
        content ||
        featuredImage ||
        metaTitle ||
        metaDescription ||
        isPublished,
      );
    }
    return (
      title !== (post?.title ?? "") ||
      slug !== (post?.slug ?? "") ||
      excerpt !== (post?.excerpt ?? "") ||
      content !== (post?.content ?? "") ||
      featuredImage !== (post?.featuredImage ?? "") ||
      metaTitle !== (post?.metaTitle ?? "") ||
      metaDescription !== (post?.metaDescription ?? "") ||
      isPublished !== (post?.isPublished ?? false)
    );
  }, [
    content,
    excerpt,
    featuredImage,
    isNew,
    isPublished,
    metaDescription,
    metaTitle,
    post,
    slug,
    title,
  ]);
  useUnsavedChangesGuard(isDirty && !saving);

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
      setSavedMessage("Saved");
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
              setSavedMessage(null);
              if (isNew) setSlug(slugify(event.target.value));
            }}
          />
        </AdminField>

        <details
          className="rounded-lg border border-border p-3"
          open={advancedOpen}
          onToggle={(event) => setAdvancedOpen((event.target as HTMLDetailsElement).open)}
        >
          <summary className="cursor-pointer text-sm font-medium min-h-11 flex items-center">
            Advanced details
          </summary>
          <div className="mt-3 space-y-3">
            {isNew ? (
              <>
                <p className="text-xs text-muted">Page address (auto-generated from the title)</p>
                <p className="font-mono text-sm break-all">/blog/{slug || "your-post"}</p>
                <p className="text-xs text-muted">
                  Renaming the title on a new post also updates this page address.
                </p>
              </>
            ) : (
              <AdminField
                label="Page address"
                htmlFor="slug"
                required
                hint={`/blog/${slug || "your-post"}`}
              >
                <Input
                  id="slug"
                  value={slug}
                  onChange={(event) => {
                    setSlug(slugify(event.target.value));
                    setSavedMessage(null);
                  }}
                />
              </AdminField>
            )}
          </div>
        </details>

        <AdminField label="Excerpt" htmlFor="excerpt" required>
          <Textarea
            id="excerpt"
            value={excerpt}
            onChange={(event) => {
              setExcerpt(event.target.value);
              setSavedMessage(null);
            }}
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
            onChange={(event) => {
              setContent(event.target.value);
              setSavedMessage(null);
            }}
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
            onChange={(event) => {
              setFeaturedImage(event.target.value);
              setSavedMessage(null);
            }}
          />
        </AdminField>
        <AdminField label="SEO title" htmlFor="metaTitle">
          <Input
            id="metaTitle"
            value={metaTitle}
            onChange={(event) => {
              setMetaTitle(event.target.value);
              setSavedMessage(null);
            }}
          />
        </AdminField>
        <AdminField label="SEO description" htmlFor="metaDescription">
          <Textarea
            id="metaDescription"
            value={metaDescription}
            onChange={(event) => {
              setMetaDescription(event.target.value);
              setSavedMessage(null);
            }}
            rows={3}
          />
        </AdminField>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(event) => {
              setIsPublished(event.target.checked);
              setSavedMessage(null);
            }}
          />
          Published
        </label>
        {error ? <FormErrorBanner message={error} /> : null}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save post"}
          </Button>
          <AdminSaveStatus message={!isDirty ? savedMessage : null} />
        </div>
      </form>
    </div>
  );
}
