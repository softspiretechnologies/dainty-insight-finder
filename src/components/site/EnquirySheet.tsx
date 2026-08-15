import { useRef, useState } from "react";

import { EnquiryForm, type EnquiryFormProps } from "@/components/site/EnquiryForm";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type EnquirySheetProps = EnquiryFormProps & {
  triggerLabel?: string;
  triggerClassName?: string;
};

export function EnquirySheet({
  triggerLabel = "Get a Quote",
  triggerClassName,
  ...formProps
}: EnquirySheetProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={
          triggerClassName ??
          "inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-3 rounded-full bg-foreground px-5 sm:px-8 py-4 text-xs font-semibold uppercase tracking-widest text-background hover:bg-primary"
        }
      >
        {triggerLabel}
      </Button>
      <Sheet
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) requestAnimationFrame(() => triggerRef.current?.focus());
        }}
      >
        <SheetContent side="bottom" className="mx-auto max-h-[92dvh] w-full max-w-lg rounded-t-2xl">
          <SheetHeader className="text-left">
            <SheetTitle className="font-display text-2xl italic">Send an enquiry</SheetTitle>
            <SheetDescription className="text-sm text-muted">
              We save your details first so we can follow up even if WhatsApp is closed.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 pb-4">
            <EnquiryForm {...formProps} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
