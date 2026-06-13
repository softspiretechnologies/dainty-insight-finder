import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { MessageCircle, Mail, Instagram, User, MapPin, Check, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAdminSettings, saveAdminSettings } from "@/lib/api/admin/settings";

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await saveAdminSettings({
        data: {
          whatsappNumber,
          email,
          instagramUrl,
          instagramHandle,
          founder,
          location,
        },
      });
      await router.invalidate();
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl md:text-5xl italic tracking-tight">Site settings</h1>
        <p className="text-sm text-muted mt-1.5">Contact details used across all public pages.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Contact channels */}
        <div className="border border-border rounded-xl p-4 sm:p-5 space-y-5 bg-surface/20">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">Contact channels</p>

          <FieldGroup icon={MessageCircle}>
            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">WhatsApp number</Label>
              <Input
                id="whatsappNumber"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="919999999999"
                required
                className="h-11 font-mono"
              />
              <p className="text-xs text-muted">Country code + number, digits only (e.g. 919876543210).</p>
            </div>
          </FieldGroup>

          <FieldGroup icon={Mail}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@daintyhand.in"
                required
                className="h-11"
              />
            </div>
          </FieldGroup>

          <FieldGroup icon={Instagram}>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="instagramUrl">Instagram URL</Label>
                <Input
                  id="instagramUrl"
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://www.instagram.com/dainty.handd/"
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagramHandle">Handle</Label>
                <Input
                  id="instagramHandle"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  placeholder="@dainty.handd"
                  required
                  className="h-11 w-full sm:w-36"
                />
              </div>
            </div>
          </FieldGroup>
        </div>

        {/* Studio info */}
        <div className="border border-border rounded-xl p-4 sm:p-5 space-y-5 bg-surface/20">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">Studio info</p>

          <FieldGroup icon={User}>
            <div className="space-y-2">
              <Label htmlFor="founder">Founder name</Label>
              <Input
                id="founder"
                value={founder}
                onChange={(e) => setFounder(e.target.value)}
                placeholder="Nafisa"
                required
                className="h-11"
              />
              <p className="text-xs text-muted">Used in WhatsApp greetings and site copy.</p>
            </div>
          </FieldGroup>

          <FieldGroup icon={MapPin}>
            <div className="space-y-2">
              <Label htmlFor="location">Studio location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Perinthalmanna, Malappuram, Kerala"
                required
                className="h-11"
              />
            </div>
          </FieldGroup>
        </div>

        {/* Error / success */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {success && !error && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <Check className="w-4 h-4 shrink-0" />
            Settings saved — changes are live across the site.
          </div>
        )}

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
    </div>
  );
}
