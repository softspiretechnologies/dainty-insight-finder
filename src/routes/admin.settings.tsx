import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

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

function AdminSettingsPage() {
  const { settings } = Route.useLoaderData();

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
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl md:text-4xl italic tracking-tight mb-2">Site settings</h1>
      <p className="text-sm text-muted mb-6 md:mb-8">Contact details used across the public site.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="whatsappNumber">WhatsApp number</Label>
          <Input
            id="whatsappNumber"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="919999999999"
            required
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instagramUrl">Instagram URL</Label>
          <Input id="instagramUrl" type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} required className="h-11" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instagramHandle">Instagram handle</Label>
          <Input id="instagramHandle" value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} required className="h-11" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="founder">Founder name</Label>
          <Input id="founder" value={founder} onChange={(e) => setFounder(e.target.value)} required className="h-11" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} required className="h-11" />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {success ? <p className="text-sm text-primary">Settings saved.</p> : null}

        <Button type="submit" disabled={loading} className="w-full sm:w-auto h-11">
          {loading ? "Saving…" : "Save settings"}
        </Button>
      </form>
    </div>
  );
}
