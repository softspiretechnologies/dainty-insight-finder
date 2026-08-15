import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { FormErrorBanner } from "@/components/admin/AdminField";
import { AdminPagePending } from "@/components/admin/AdminSkeleton";
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
  pendingComponent: () => <AdminPagePending label="Loading blog posts…" />,
  component: AdminBlogPage,
});

function AdminBlogPage() {
  const data = Route.useLoaderData();
  const posts = data?.posts ?? [];
  const loadError = data?.error;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);

  const togglePublished = async (id: number, published: boolean) => {
    setError(null);
    try {
      await toggleAdminBlogPost({ data: { id, published } });
      await router.invalidate();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to update post");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    setError(null);
    try {
      await deleteAdminBlogPost({ data: { id: deleteTarget.id } });
      setDeleteTarget(null);
      await router.invalidate();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to delete post");
    } finally {
      setDeletingId(null);
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
          <p className="font-display text-xl italic">No blog posts yet</p>
          <p className="text-sm text-muted mt-1">Create a post to publish in the journal.</p>
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
                <p className="truncate text-xs text-muted mt-1">Page: /blog/{post.slug}</p>
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
                  aria-label={`Delete ${post.title}`}
                  disabled={deletingId === post.id}
                  onClick={() => setDeleteTarget({ id: post.id, title: post.title })}
                >
                  {deletingId === post.id ? (
                    <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && deletingId === null) setDeleteTarget(null);
        }}
        title={deleteTarget ? `Delete "${deleteTarget.title}"?` : "Delete post?"}
        description="This post will be permanently removed."
        confirmLabel="Delete post"
        cancelLabel="Cancel"
        destructive
        loading={deletingId !== null}
        onConfirm={handleDelete}
      />
    </div>
  );
}
