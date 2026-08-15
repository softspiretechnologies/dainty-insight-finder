import { cn } from "@/lib/utils";

/** Lightweight placeholder blocks for Admin pending UI. Respects reduced motion. */
export function AdminSkeleton({ className, rows = 3 }: { className?: string; rows?: number }) {
  return (
    <div className={cn("space-y-3", className)} aria-hidden>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-11 rounded-lg bg-surface/80 motion-safe:animate-pulse" />
      ))}
    </div>
  );
}

export function AdminPagePending({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-label={label}>
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-surface/80 motion-safe:animate-pulse" />
        <div className="h-4 w-64 max-w-full rounded bg-surface/60 motion-safe:animate-pulse" />
      </div>
      <AdminSkeleton rows={4} />
    </div>
  );
}
