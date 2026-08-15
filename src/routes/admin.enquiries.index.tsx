import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Inbox, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

import { FormErrorBanner } from "@/components/admin/AdminField";
import { Input } from "@/components/ui/input";
import { getAdminEnquirySummary, listAdminEnquiries } from "@/lib/api/admin/enquiries";
import { formatAdminDateTime } from "@/lib/admin-format";
import {
  ENQUIRY_STATUSES,
  ENQUIRY_STATUS_LABELS,
  enquiryInterestLabel,
  enquirySourceLabel,
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
  loader: async ({ deps }) => {
    const [list, summary] = await Promise.all([
      listAdminEnquiries({
        data: { status: deps.status, q: deps.q || undefined },
      }),
      getAdminEnquirySummary(),
    ]);
    return { ...list, counts: summary };
  },
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
  const [query, setQuery] = useState(search.q ?? "");
  const items = data?.enquiries ?? [];
  const loadError = data?.error;
  const counts = data?.counts;

  useEffect(() => {
    setQuery(search.q ?? "");
  }, [search.q]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = query.trim();
      const current = (search.q ?? "").trim();
      if (next === current) return;
      void navigate({
        search: (prev) => ({ ...prev, q: next || undefined }),
        replace: true,
      });
    }, 350);
    return () => window.clearTimeout(handle);
  }, [navigate, query, search.q]);

  const setStatus = (status: "all" | EnquiryStatus) => {
    void navigate({ search: (prev) => ({ ...prev, status }) });
  };

  const clearSearch = () => {
    setQuery("");
    void navigate({ search: (prev) => ({ ...prev, q: undefined }), replace: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl md:text-5xl italic tracking-tight">Enquiries</h1>
        <p className="text-sm text-muted mt-1">Customers who reached out from the website.</p>
      </div>

      {loadError ? <FormErrorBanner message={loadError} /> : null}

      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={search.status === "all"}
          onClick={() => setStatus("all")}
          label={`All${counts ? ` ${counts.all}` : ""}`}
        />
        {ENQUIRY_STATUSES.map((status) => (
          <FilterChip
            key={status}
            active={search.status === status}
            onClick={() => setStatus(status)}
            label={`${ENQUIRY_STATUS_LABELS[status]}${counts ? ` ${counts[status]}` : ""}`}
          />
        ))}
      </div>

      <div className="relative sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search enquiries…"
          aria-label="Search enquiries"
          className="pl-9 pr-11 h-11"
        />
        {query ? (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-md text-muted hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

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
                    </div>
                    <p className="text-sm mt-2 min-w-0 break-words">
                      {enquiryInterestLabel(enquiry)}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {enquirySourceLabel(enquiry.source)}
                      {enquiry.eventDate ? ` · Event ${enquiry.eventDate}` : ""}
                    </p>
                    <p className="text-xs text-muted mt-1 break-all">{enquiry.phone}</p>
                  </div>
                  <time className="text-[11px] text-muted shrink-0">
                    {formatAdminDateTime(enquiry.createdAt)}
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
