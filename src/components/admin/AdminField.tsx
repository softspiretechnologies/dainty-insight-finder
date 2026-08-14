import { cloneElement, isValidElement, type ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function AdminField({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  const errorId = `${htmlFor}-error`;
  const descriptionId = error ? errorId : hint ? `${htmlFor}-hint` : undefined;
  const control = isValidElement<{
    "aria-describedby"?: string;
    "aria-invalid"?: boolean | "true" | "false";
  }>(children)
    ? cloneElement(children, {
        "aria-invalid": error ? true : children.props["aria-invalid"],
        "aria-describedby": descriptionId ?? children.props["aria-describedby"],
      })
    : children;

  return (
    <div className="min-w-0 space-y-2" id={`field-${htmlFor}`}>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-destructive ml-0.5">*</span> : null}
      </Label>
      <div>{control}</div>
      {hint && !error ? (
        <p id={`${htmlFor}-hint`} className="break-words text-xs text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="break-words text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function FormErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="break-words rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
      role="alert"
    >
      {message}
    </div>
  );
}

export function FormSuccessBanner({ message }: { message: string }) {
  return (
    <div
      className="break-words rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
      role="status"
    >
      {message}
    </div>
  );
}

export function invalidBoxClass(error?: string) {
  return cn(error && "border-destructive ring-1 ring-destructive");
}
