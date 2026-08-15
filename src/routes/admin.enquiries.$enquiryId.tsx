import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle, Phone } from "lucide-react";
import { useMemo, useState } from "react";

import { FormErrorBanner } from "@/components/admin/AdminField";
import { AdminSaveStatus } from "@/components/admin/AdminSaveStatus";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { getAdminEnquiry, updateAdminEnquiry } from "@/lib/api/admin/enquiries";
import { formatAdminDateTime } from "@/lib/admin-format";
import {
  ENQUIRY_STATUSES,
  ENQUIRY_STATUS_LABELS,
  buildAdminWhatsAppMessage,
  enquiryInterestLabel,
  enquirySourceLabel,
  enquiryTelHref,
  type EnquiryStatus,
} from "@/lib/enquiries";
import { whatsappLink } from "@/lib/site";

export const Route = createFileRoute("/admin/enquiries/$enquiryId")({
  loader: async ({ params }) => {
    const id = Number(params.enquiryId);
    if (!Number.isInteger(id) || id < 1) throw notFound();
    const enquiry = await getAdminEnquiry({ data: { id } });
    if (!enquiry) throw notFound();
    return { enquiry };
  },
  component: AdminEnquiryDetailPage,
  notFoundComponent: () => (
    <div className="space-y-4">
      <h1 className="font-display text-3xl italic">Enquiry not found</h1>
      <Link to="/admin/enquiries" className="text-sm underline">
        Back to enquiries
      </Link>
    </div>
  ),
});

function AdminEnquiryDetailPage() {
  const { enquiry } = Route.useLoaderData();
  const router = useRouter();
  const [status, setStatus] = useState(enquiry.status);
  const [notes, setNotes] = useState(enquiry.adminNotes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isDirty = useMemo(
    () => status !== enquiry.status || notes !== (enquiry.adminNotes ?? ""),
    [enquiry.adminNotes, enquiry.status, notes, status],
  );
  useUnsavedChangesGuard(isDirty);

  const customerWa = whatsappLink(buildAdminWhatsAppMessage(enquiry), enquiry.phone);

  const saveChanges = async () => {
    setError(null);
    setSavedMessage(null);
    setSaving(true);
    try {
      await updateAdminEnquiry({
        data: {
          id: enquiry.id,
          status: status as EnquiryStatus,
          adminNotes: notes,
        },
      });
      setSavedMessage("Saved");
      await router.invalidate();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6 pb-24 lg:pb-0">
      <div>
        <Link
          to="/admin/enquiries"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back to enquiries
        </Link>
        <h1 className="font-display text-3xl md:text-5xl italic tracking-tight mt-3">
          {enquiry.name}
        </h1>
        <p className="text-sm text-muted mt-1">
          {enquiryInterestLabel(enquiry)} · {enquirySourceLabel(enquiry.source)}
        </p>
      </div>

      {error ? <FormErrorBanner message={error} /> : null}

      {/* Desktop / tablet actions */}
      <div className="hidden sm:flex flex-row gap-2">
        <a
          href={customerWa}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#25d366] px-4 text-sm font-medium text-white hover:opacity-90"
        >
          <MessageCircle className="w-4 h-4" /> Open WhatsApp
        </a>
        <a
          href={enquiryTelHref(enquiry.phone)}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-border px-4 text-sm hover:border-foreground"
        >
          <Phone className="w-4 h-4" /> Call
        </a>
      </div>

      <dl className="grid gap-4 border border-border rounded-xl p-4 sm:p-5">
        <Detail
          label="Phone"
          value={
            <a href={enquiryTelHref(enquiry.phone)} className="underline underline-offset-2">
              {enquiry.phone}
            </a>
          }
        />
        {enquiry.email ? (
          <Detail
            label="Email"
            value={
              <a
                href={`mailto:${enquiry.email}`}
                className="underline underline-offset-2 break-all"
              >
                {enquiry.email}
              </a>
            }
          />
        ) : null}
        {enquiry.eventType ? <Detail label="Event type" value={enquiry.eventType} /> : null}
        {enquiry.eventDate ? <Detail label="Event date" value={enquiry.eventDate} /> : null}
        {enquiry.budget ? <Detail label="Budget" value={enquiry.budget} /> : null}
        {enquiry.productNameSnapshot ? (
          <Detail label="Product" value={enquiry.productNameSnapshot} />
        ) : null}
        {enquiry.serviceTitleSnapshot ? (
          <Detail label="Service" value={enquiry.serviceTitleSnapshot} />
        ) : null}
        <Detail label="Came from" value={enquirySourceLabel(enquiry.source)} />
        <Detail label="Received" value={formatAdminDateTime(enquiry.createdAt)} />
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            Customer message
          </dt>
          <dd className="text-sm mt-1 whitespace-pre-wrap break-words">{enquiry.message}</dd>
        </div>
      </dl>

      <div className="space-y-4 border border-border rounded-xl p-4 sm:p-5">
        <div className="space-y-2">
          <Label htmlFor="enquiry-status">Status</Label>
          <select
            id="enquiry-status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setSavedMessage(null);
            }}
            className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {ENQUIRY_STATUSES.map((value) => (
              <option key={value} value={value}>
                {ENQUIRY_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="enquiry-notes">Internal notes</Label>
          <p className="text-xs text-muted">Only visible to you — never shown to customers.</p>
          <Textarea
            id="enquiry-notes"
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
              setSavedMessage(null);
            }}
            rows={5}
            className="min-h-28"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={saveChanges}
            disabled={saving || !isDirty}
            className="min-h-11"
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <AdminSaveStatus message={savedMessage} />
        </div>
      </div>

      {/* Mobile customer actions — sits above bottom admin nav, not overlapping */}
      <div
        className="sm:hidden fixed inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur px-4 pt-3"
        style={{
          bottom: "calc(3.5rem + max(env(safe-area-inset-bottom), 0.5rem))",
          paddingBottom: "0.75rem",
          paddingLeft: "max(1rem, env(safe-area-inset-left, 0px))",
          paddingRight: "max(1rem, env(safe-area-inset-right, 0px))",
        }}
      >
        <div className="flex gap-2 max-w-2xl mx-auto">
          <a
            href={customerWa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#25d366] px-4 text-sm font-medium text-white"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
          <a
            href={enquiryTelHref(enquiry.phone)}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-border px-4 text-sm"
          >
            <Phone className="w-4 h-4" /> Call
          </a>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{label}</dt>
      <dd className="text-sm mt-1 break-words">{value}</dd>
    </div>
  );
}
