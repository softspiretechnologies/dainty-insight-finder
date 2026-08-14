import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { MessageCircle, Mail, Instagram, User, MapPin, Check } from "lucide-react";

import { AdminField, FormErrorBanner, FormSuccessBanner } from "@/components/admin/AdminField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminSettingsFormSchema } from "@/lib/admin-schemas";
import {
  invalidInputClass,
  scrollToFirstField,
  validateForm,
  type FieldErrors,
} from "@/lib/admin-validation";
import { getAdminSettings, saveAdminSettings } from "@/lib/api/admin/settings";
import { changePassword, logoutAllAdminSessions } from "@/lib/api/admin/account";
import { logoutAdmin } from "@/lib/api/admin/auth";

export const Route = createFileRoute("/admin/settings")({
  loader: async () => {
    const settings = await getAdminSettings();
    return { settings };
  },
  component: AdminSettingsPage,
});

function FieldGroup({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 sm:gap-4">
      <div className="pt-9 shrink-0">
        <Icon className="w-4 h-4 text-muted" />
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function AdminSettingsPage() {
  const { settings } = Route.useLoaderData();
  const router = useRouter();

  const [whatsappNumber, setWhatsappNumber] = useState(settings?.whatsappNumber ?? "");
  const [email, setEmail] = useState(settings?.email ?? "");
  const [instagramUrl, setInstagramUrl] = useState(settings?.instagramUrl ?? "");
  const [instagramHandle, setInstagramHandle] = useState(settings?.instagramHandle ?? "");
  const [founder, setFounder] = useState(settings?.founder ?? "");
  const [location, setLocation] = useState(settings?.location ?? "");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    setAccountError(null);
    setAccountLoading(true);
    try {
      const result = await changePassword({
        data: { currentPassword, newPassword, confirmPassword },
      });
      if (!result.ok) {
        setAccountError(result.error);
        setAccountLoading(false);
        return;
      }
      await router.navigate({ to: "/admin/login" });
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "Failed to change password");
      setAccountLoading(false);
    }
  };

  const endSession = async (all: boolean) => {
    setAccountError(null);
    try {
      if (all) await logoutAllAdminSessions();
      else await logoutAdmin();
      await router.navigate({ to: "/admin/login" });
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "Failed to log out");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(false);

    const payload = { whatsappNumber, email, instagramUrl, instagramHandle, founder, location };
    const validation = validateForm(adminSettingsFormSchema, payload);
    if (!validation.ok) {
      setFieldErrors(validation.errors);
      scrollToFirstField(validation.errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      await saveAdminSettings({ data: validation.data });
      await router.invalidate();
      setSuccess(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6 md:space-y-8">
      <div>
        <h1 className="font-display text-3xl md:text-5xl italic tracking-tight">Site settings</h1>
        <p className="text-sm text-muted mt-1.5">Contact details used across all public pages.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="border border-border rounded-xl p-4 sm:p-5 space-y-5 bg-surface/20">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
            Contact channels
          </p>

          <FieldGroup icon={MessageCircle}>
            <AdminField
              label="WhatsApp number"
              htmlFor="whatsappNumber"
              required
              error={fieldErrors.whatsappNumber}
              hint="Country code + number, digits only (e.g. 919876543210)."
            >
              <Input
                id="whatsappNumber"
                value={whatsappNumber}
                onChange={(e) => {
                  setWhatsappNumber(e.target.value);
                  clearFieldError("whatsappNumber");
                }}
                placeholder="919999999999"
                inputMode="numeric"
                className={`h-11 font-mono ${invalidInputClass(fieldErrors.whatsappNumber)}`}
              />
            </AdminField>
          </FieldGroup>

          <FieldGroup icon={Mail}>
            <AdminField label="Email" htmlFor="email" required error={fieldErrors.email}>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError("email");
                }}
                placeholder="hello@daintyhand.in"
                className={`h-11 ${invalidInputClass(fieldErrors.email)}`}
              />
            </AdminField>
          </FieldGroup>

          <FieldGroup icon={Instagram}>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
              <AdminField
                label="Instagram URL"
                htmlFor="instagramUrl"
                required
                error={fieldErrors.instagramUrl}
              >
                <Input
                  id="instagramUrl"
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => {
                    setInstagramUrl(e.target.value);
                    clearFieldError("instagramUrl");
                  }}
                  placeholder="https://www.instagram.com/dainty.handd/"
                  className={`h-11 ${invalidInputClass(fieldErrors.instagramUrl)}`}
                />
              </AdminField>
              <AdminField
                label="Handle"
                htmlFor="instagramHandle"
                required
                error={fieldErrors.instagramHandle}
              >
                <Input
                  id="instagramHandle"
                  value={instagramHandle}
                  onChange={(e) => {
                    setInstagramHandle(e.target.value);
                    clearFieldError("instagramHandle");
                  }}
                  placeholder="@dainty.handd"
                  className={`h-11 w-full sm:w-36 ${invalidInputClass(fieldErrors.instagramHandle)}`}
                />
              </AdminField>
            </div>
          </FieldGroup>
        </div>

        <div className="border border-border rounded-xl p-4 sm:p-5 space-y-5 bg-surface/20">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
            Studio info
          </p>

          <FieldGroup icon={User}>
            <AdminField
              label="Founder name"
              htmlFor="founder"
              required
              error={fieldErrors.founder}
              hint="Used in WhatsApp greetings and site copy."
            >
              <Input
                id="founder"
                value={founder}
                onChange={(e) => {
                  setFounder(e.target.value);
                  clearFieldError("founder");
                }}
                placeholder="Nafisa"
                className={`h-11 ${invalidInputClass(fieldErrors.founder)}`}
              />
            </AdminField>
          </FieldGroup>

          <FieldGroup icon={MapPin}>
            <AdminField
              label="Studio location"
              htmlFor="location"
              required
              error={fieldErrors.location}
            >
              <Input
                id="location"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  clearFieldError("location");
                }}
                placeholder="Perinthalmanna, Malappuram, Kerala"
                className={`h-11 ${invalidInputClass(fieldErrors.location)}`}
              />
            </AdminField>
          </FieldGroup>
        </div>

        {formError ? <FormErrorBanner message={formError} /> : null}
        {success && !formError ? (
          <FormSuccessBanner message="Settings saved — changes are live across the site." />
        ) : null}

        <Button type="submit" disabled={loading} className="w-full sm:w-auto h-11 min-w-[160px]">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Saving…
            </span>
          ) : success ? (
            <span className="inline-flex items-center gap-2">
              <Check className="w-4 h-4" />
              Saved
            </span>
          ) : (
            "Save settings"
          )}
        </Button>
      </form>

      <div className="border-t border-border pt-8 space-y-6">
        <div>
          <h2 className="font-display text-2xl italic">Admin account</h2>
          <p className="text-sm text-muted mt-1">
            Changing your password revokes every existing admin session.
          </p>
        </div>
        <form
          onSubmit={handlePasswordChange}
          className="space-y-4 border border-border rounded-xl p-4 sm:p-5"
        >
          <AdminField label="Current password" htmlFor="currentPassword" required>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="h-11"
            />
          </AdminField>
          <AdminField
            label="New password"
            htmlFor="newPassword"
            required
            hint="At least 12 characters."
          >
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="h-11"
            />
          </AdminField>
          <AdminField label="Confirm new password" htmlFor="confirmPassword" required>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="h-11"
            />
          </AdminField>
          {accountError ? <FormErrorBanner message={accountError} /> : null}
          <Button type="submit" disabled={accountLoading} className="w-full sm:w-auto">
            {accountLoading ? "Changing…" : "Change password"}
          </Button>
        </form>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => endSession(false)}
          >
            Log out current session
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => endSession(true)}
          >
            Log out all sessions
          </Button>
        </div>
      </div>
    </div>
  );
}
