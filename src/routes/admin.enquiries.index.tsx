import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { FormErrorBanner } from "@/components/admin/AdminField";
import { Input } from "@/components/ui/input";
import { listAdminEnquiries } from "@/lib/api/admin/enquiries";
import {
  ENQUIRY_STATUSES,
  ENQUIRY_STATUS_LABELS,
  enquiryInterestLabel,
  type EnquiryStatus,
} from "@/lib/enquiries";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  status: z.enum(ENQUIRY_STATUSES).or(z.literal("all")).catch("all"),
  q: z.string().optional().catch(""),
});

export const Route = createFileRoute("/admin/enquiries/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ status: search.status, q: search.q }),
  loader: ({ deps }) =>
    listAdminEnquiries({
      data: { status: deps.status, q: deps.q || undefined },
    }),
  component: AdminEnquiriesPage,
});

function statusTone(status: string) {
  if (status === "new") return "bg-amber-50 text-amber-800 border-amber-200";
  if (status === "contacted") return "bg-sky-50 text-sky-800 border-sky-200";
  if (status === "quoted") return "bg-violet-50 text-violet-800 border-violet-200";
  if (status === "confirmed") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (status === "lost") return "bg-stone-100 text-stone-600 border-stone-200";
  return "bg-surface text-muted border-border";
}

function AdminEnquiriesPage() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const router = useRouter();
  const [query, setQuery] = useState(search.q ?? "");
  const items = data?.enquiries ?? [];
  const loadError = data?.error;

  const setStatus = (status: "all" | EnquiryStatus) => {
    void navigate({ search: (prev) => ({ ...prev, status }) });
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    void navigate({ search: (prev) => ({ ...prev, q: query.trim() || undefined }) });
    void router.invalidate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl md:text-5xl italic tracking-tight">Enquiries</h1>
        <p className="text-sm text-muted mt-1">Leads from the website — follow up on WhatsApp.</p>
      </div>

      {loadError ? <FormErrorBanner message={loadError} /> : null}

      <div className="flex flex-wrap gap-2">
        <FilterChip active={search.status === "all"} onClick={() => setStatus("all")} label="All" />
        {ENQUIRY_STATUSES.map((status) => (
          <FilterChip
            key={status}
            active={search.status === status}
            onClick={() => setStatus(status)}
            label={ENQUIRY_STATUS_LABELS[status]}
          />
        ))}
      </div>

      <form onSubmit={submitSearch} className="flex flex-col sm:flex-row gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, phone, product…"
          aria-label="Search enquiries"
          className="sm:max-w-sm"
        />
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm hover:border-foreground"
        >
          Search
        </button>
      </form>

      {items.length === 0 && !loadError ? (
        <div className="border border-dashed border-border rounded-xl py-16 text-center">
          <Inbox className="w-9 h-9 text-muted mx-auto mb-3" />
          <p className="font-display text-xl italic">No enquiries yet</p>
          <p className="text-sm text-muted mt-1">New leads from the site will appear here.</p>
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="border border-border rounded-xl divide-y divide-border overflow-hidden">
          {items.map((enquiry) => {
            const isNew = enquiry.status === "new";
            return (
              <Link
                key={enquiry.id}
                to="/admin/enquiries/$enquiryId"
                params={{ enquiryId: String(enquiry.id) }}
                className={cn(
                  "block p-4 hover:bg-surface/50 transition-colors",
                  isNew && "bg-amber-50/40",
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-medium truncate">{enquiry.name}</h2>
                      <span
                        className={cn(
                          "text-[9px] uppercase tracking-wider border rounded-full px-2 py-0.5",
                          statusTone(enquiry.status),
                        )}
                      >
                        {ENQUIRY_STATUS_LABELS[enquiry.status as EnquiryStatus] ?? enquiry.status}
                      </span>
                      {isNew ? (
                        <span className="text-[9px] uppercase tracking-wider text-amber-700 font-semibold">
                          New
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted mt-1 break-all">{enquiry.phone}</p>
                    <p className="text-sm mt-2 min-w-0 break-words">
                      {enquiryInterestLabel(enquiry)}
                      <span className="text-muted"> · {enquiry.source}</span>
                    </p>
                    {enquiry.eventDate ? (
                      <p className="text-xs text-muted mt-1">Event: {enquiry.eventDate}</p>
                    ) : null}
                  </div>
                  <time className="text-[11px] text-muted shrink-0 font-mono">
                    {new Date(enquiry.createdAt).toLocaleString()}
                  </time>
                </div>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-full border px-4 text-xs uppercase tracking-widest transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border text-muted hover:border-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
