import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle, Phone } from "lucide-react";
import { useState } from "react";

import { FormErrorBanner, FormSuccessBanner } from "@/components/admin/AdminField";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getAdminEnquiry,
  updateAdminEnquiryNotes,
  updateAdminEnquiryStatus,
} from "@/lib/api/admin/enquiries";
import {
  ENQUIRY_STATUSES,
  ENQUIRY_STATUS_LABELS,
  buildAdminWhatsAppMessage,
  enquiryInterestLabel,
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
  const [success, setSuccess] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  const customerWa = whatsappLink(buildAdminWhatsAppMessage(enquiry), enquiry.phone);

  const saveStatus = async () => {
    setError(null);
    setSuccess(null);
    setSavingStatus(true);
    try {
      await updateAdminEnquiryStatus({
        data: { id: enquiry.id, status: status as EnquiryStatus },
      });
      setSuccess("Status updated.");
      await router.invalidate();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update status.");
    } finally {
      setSavingStatus(false);
    }
  };

  const saveNotes = async () => {
    setError(null);
    setSuccess(null);
    setSavingNotes(true);
    try {
      await updateAdminEnquiryNotes({ data: { id: enquiry.id, adminNotes: notes } });
      setSuccess("Notes saved.");
      await router.invalidate();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save notes.");
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
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
          {enquiryInterestLabel(enquiry)} · {enquiry.source}
        </p>
      </div>

      {error ? <FormErrorBanner message={error} /> : null}
      {success ? <FormSuccessBanner message={success} /> : null}

      <div className="flex flex-col sm:flex-row gap-2">
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
        <Detail label="Phone" value={enquiry.phone} />
        {enquiry.email ? <Detail label="Email" value={enquiry.email} /> : null}
        {enquiry.eventType ? <Detail label="Event type" value={enquiry.eventType} /> : null}
        {enquiry.eventDate ? <Detail label="Event date" value={enquiry.eventDate} /> : null}
        {enquiry.budget ? <Detail label="Budget" value={enquiry.budget} /> : null}
        {enquiry.productNameSnapshot ? (
          <Detail label="Product" value={enquiry.productNameSnapshot} />
        ) : null}
        {enquiry.serviceTitleSnapshot ? (
          <Detail label="Service" value={enquiry.serviceTitleSnapshot} />
        ) : null}
        <Detail label="Source" value={enquiry.source} />
        <Detail label="Received" value={new Date(enquiry.createdAt).toLocaleString()} />
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Message</dt>
          <dd className="text-sm mt-1 whitespace-pre-wrap break-words">{enquiry.message}</dd>
        </div>
      </dl>

      <div className="space-y-3 border border-border rounded-xl p-4 sm:p-5">
        <Label htmlFor="enquiry-status">Status</Label>
        <select
          id="enquiry-status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        >
          {ENQUIRY_STATUSES.map((value) => (
            <option key={value} value={value}>
              {ENQUIRY_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
        <Button type="button" onClick={saveStatus} disabled={savingStatus} className="min-h-11">
          {savingStatus ? "Saving…" : "Update status"}
        </Button>
      </div>

      <div className="space-y-3 border border-border rounded-xl p-4 sm:p-5">
        <Label htmlFor="enquiry-notes">Internal notes (never shown publicly)</Label>
        <Textarea
          id="enquiry-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={5}
          className="min-h-28"
        />
        <Button type="button" onClick={saveNotes} disabled={savingNotes} className="min-h-11">
          {savingNotes ? "Saving…" : "Save notes"}
        </Button>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{label}</dt>
      <dd className="text-sm mt-1 break-words">{value}</dd>
    </div>
  );
}
