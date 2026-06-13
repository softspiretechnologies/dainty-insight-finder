import type { z } from "zod";

export type FieldErrors = Record<string, string>;

export function zodFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function validateForm<T>(schema: z.ZodType<T>, data: unknown): { ok: true; data: T } | { ok: false; errors: FieldErrors } {
  const result = schema.safeParse(data);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, errors: zodFieldErrors(result.error) };
}

export function scrollToFirstField(errors: FieldErrors) {
  const firstKey = Object.keys(errors).find((key) => key !== "_form");
  if (!firstKey) return;
  const el = document.getElementById(`field-${firstKey}`);
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
    el.focus();
  }
}

export function invalidInputClass(error?: string) {
  return error ? "border-destructive ring-1 ring-destructive focus-visible:ring-destructive" : "";
}
