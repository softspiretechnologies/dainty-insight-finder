import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/** Compact inline save feedback next to the action that was performed. */
export function AdminSaveStatus({
  message,
  className,
}: {
  message: string | null;
  className?: string;
}) {
  if (!message) return null;
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn("inline-flex items-center gap-1.5 text-sm text-emerald-700", className)}
    >
      <Check className="w-4 h-4 shrink-0" aria-hidden />
      {message}
    </p>
  );
}
