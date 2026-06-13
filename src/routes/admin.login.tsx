import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Lock } from "lucide-react";

import { AdminField, FormErrorBanner } from "@/components/admin/AdminField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginSchema } from "@/lib/admin-schemas";
import { invalidInputClass, scrollToFirstField, validateForm, type FieldErrors } from "@/lib/admin-validation";
import { loginAdmin } from "@/lib/api/admin/auth";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validation = validateForm(loginSchema, { email, password });
    if (!validation.ok) {
      setFieldErrors(validation.errors);
      scrollToFirstField(validation.errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const result = await loginAdmin({ data: validation.data });
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      await router.navigate({ to: "/admin" });
    } catch {
      setFormError("Login failed. Check database configuration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-foreground flex items-center justify-center mx-auto mb-5">
            <Lock className="w-5 h-5 text-background" />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">DaintyHand</p>
          <h1 className="font-display text-3xl italic mt-1.5">Admin portal</h1>
        </div>

        <form onSubmit={handleSubmit} noValidate className="border border-border rounded-2xl p-6 sm:p-7 bg-surface/30 space-y-4">
          <AdminField label="Email address" htmlFor="email" required error={fieldErrors.email}>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError("email");
              }}
              placeholder="admin@daintyhand.in"
              autoComplete="email"
              autoFocus
              className={`h-11 ${invalidInputClass(fieldErrors.email)}`}
            />
          </AdminField>

          <AdminField label="Password" htmlFor="password" required error={fieldErrors.password}>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError("password");
              }}
              autoComplete="current-password"
              className={`h-11 ${invalidInputClass(fieldErrors.password)}`}
            />
          </AdminField>

          {formError ? <FormErrorBanner message={formError} /> : null}

          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Signing in…
              </span>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted">
          <a href="/" className="hover:text-foreground transition-colors">← Back to site</a>
        </p>
      </div>
    </div>
  );
}
