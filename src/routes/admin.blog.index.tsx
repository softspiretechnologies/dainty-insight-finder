import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { FormErrorBanner } from "@/components/admin/AdminField";
import { Button } from "@/components/ui/button";
import { deleteAdminBlogPost, listAdminBlogPosts, toggleAdminBlogPost } from "@/lib/api/admin/blog";

function BlogError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl md:text-5xl italic tracking-tight">Blog</h1>
      <FormErrorBanner message={error.message || "The blog page could not be loaded."} />
      <Button type="button" variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}

export const Route = createFileRoute("/admin/blog/")({
  loader: () => listAdminBlogPosts(),
  errorComponent: BlogError,
  pendingComponent: () => <p className="text-sm text-muted">Loading blog posts…</p>,
  component: AdminBlogPage,
});

function AdminBlogPage() {
  const data = Route.useLoaderData();
  const posts = data?.posts ?? [];
  const loadError = data?.error;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const togglePublished = async (id: number, published: boolean) => {
    setError(null);
    try {
      await toggleAdminBlogPost({ data: { id, published } });
      await router.invalidate();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to update post");
    }
  };

  const remove = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setError(null);
    try {
      await deleteAdminBlogPost({ data: { id } });
      await router.invalidate();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to delete post");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-3xl md:text-5xl italic tracking-tight">Blog</h1>
          <p className="text-sm text-muted mt-1">Create and publish journal posts.</p>
        </div>
        <Button asChild className="w-full shrink-0 sm:w-auto">
          <Link to="/admin/blog/$postId" params={{ postId: "new" }}>
            <Plus className="w-4 h-4 mr-2" /> New post
          </Link>
        </Button>
      </div>

      {loadError ? <FormErrorBanner message={loadError} /> : null}
      {error ? <FormErrorBanner message={error} /> : null}
      {posts.length === 0 && !loadError ? (
        <div className="border border-dashed border-border rounded-xl py-16 text-center">
          <FileText className="w-9 h-9 text-muted mx-auto mb-3" />
          <p className="font-display text-xl italic">No database posts yet</p>
          <p className="text-sm text-muted mt-1">The existing static journal remains public.</p>
        </div>
      ) : null}
      {posts.length > 0 ? (
        <div className="border border-border rounded-xl divide-y divide-border overflow-hidden">
          {posts.map((post) => (
            <article key={post.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <h2 className="min-w-0 truncate font-medium">{post.title}</h2>
                  <span className="shrink-0 text-[9px] uppercase tracking-wider border border-border rounded-full px-2 py-0.5 text-muted">
                    {post.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="truncate text-xs text-muted mt-1">/blog/{post.slug}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11"
                  onClick={() => togglePublished(post.id, !post.isPublished)}
                >
                  {post.isPublished ? "Unpublish" : "Publish"}
                </Button>
                <Button variant="outline" size="icon" asChild aria-label="Edit post">
                  <Link to="/admin/blog/$postId" params={{ postId: String(post.id) }}>
                    <Pencil className="w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Delete post"
                  onClick={() => remove(post.id, post.title)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
