import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useId, useRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AdminConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) requestAnimationFrame(() => cancelRef.current?.focus());
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(100%-1.5rem,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-5 shadow-lg",
            "focus:outline-none",
          )}
        >
          <Dialog.Title id={titleId} className="font-display text-2xl italic">
            {title}
          </Dialog.Title>
          <Dialog.Description
            id={descriptionId}
            className="text-sm text-muted mt-2 leading-relaxed"
          >
            {description}
          </Dialog.Description>
          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              ref={cancelRef}
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              className={cn(
                "min-h-11",
                destructive && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              )}
              disabled={loading}
              onClick={() => void onConfirm()}
            >
              {loading ? "Working…" : confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
