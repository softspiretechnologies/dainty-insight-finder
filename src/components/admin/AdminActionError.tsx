import { Button } from "@/components/ui/button";

/** Actionable error banner with optional safe retry. */
export function AdminActionError({
  message,
  onRetry,
  retryLabel = "Try again",
}: {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div
      className="break-words rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
      role="alert"
    >
      <p>{message}</p>
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          className="mt-3 min-h-11 border-destructive/40 text-destructive hover:bg-destructive/5"
          onClick={onRetry}
        >
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
