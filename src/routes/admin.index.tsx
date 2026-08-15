import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Package, Settings } from "lucide-react";

import { AdminPagePending } from "@/components/admin/AdminSkeleton";
import { getAdminDashboardData } from "@/lib/api/catalog";
import { getAdminEnquirySummary } from "@/lib/api/admin/enquiries";
import { formatAdminDateTime } from "@/lib/admin-format";
import {
  ENQUIRY_STATUS_LABELS,
  enquiryInterestLabel,
  enquirySourceLabel,
  type EnquiryStatus,
} from "@/lib/enquiries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  loader: async () => {
    const [dashboard, enquiries] = await Promise.all([
      getAdminDashboardData(),
      getAdminEnquirySummary(),
    ]);
    return { ...dashboard, enquiries };
  },
  pendingComponent: () => <AdminPagePending label="Loading dashboard…" />,
  component: AdminDashboard,
});

function AdminDashboard() {
  const { productCount, enquiries } = Route.useLoaderData();
  const newCount = enquiries.new;

  return (
    <div className="max-w-3xl space-y-8 md:space-y-10">
      <div>
        <h1 className="font-display text-3xl md:text-5xl italic tracking-tight">
          DaintyHand Admin
        </h1>
        <p className="text-sm text-muted mt-1.5">What needs your attention today.</p>
      </div>

      <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5">
        <p className="font-display text-2xl sm:text-3xl italic">
          {newCount === 0
            ? "No new enquiries"
            : newCount === 1
              ? "1 new enquiry"
              : `${newCount} new enquiries`}
        </p>
        <p className="text-sm text-muted mt-1">
          {newCount === 0
            ? "You're up to date. New customer messages will show here."
            : "Customers are waiting for a reply."}
        </p>
        <Link
          to="/admin/enquiries"
          search={{ status: "new" }}
          className="inline-flex min-h-11 items-center justify-center gap-2 mt-4 rounded-full bg-foreground px-5 text-xs font-semibold uppercase tracking-widest text-background"
        >
          {newCount > 0 ? "View new enquiries" : "View enquiries"}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </section>

      {enquiries.recent.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
              Recent enquiries
            </p>
            <Link to="/admin/enquiries" className="text-xs text-muted hover:text-foreground">
              View all →
            </Link>
          </div>
          <div className="border border-border rounded-xl divide-y divide-border overflow-hidden">
            {enquiries.recent.map((enquiry) => {
              const isNew = enquiry.status === "new";
              return (
                <Link
                  key={enquiry.id}
                  to="/admin/enquiries/$enquiryId"
                  params={{ enquiryId: String(enquiry.id) }}
                  className={cn(
                    "block p-3 sm:p-4 hover:bg-surface/50 transition-colors",
                    isNew && "bg-amber-50/50",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-sm truncate">{enquiry.name}</p>
                        <span
                          className={cn(
                            "text-[9px] uppercase tracking-wider border rounded-full px-2 py-0.5",
                            isNew
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "border-border text-muted",
                          )}
                        >
                          {ENQUIRY_STATUS_LABELS[enquiry.status as EnquiryStatus] ?? enquiry.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-0.5 truncate">
                        {enquiryInterestLabel(enquiry)}
                        {!enquiry.productNameSnapshot && !enquiry.serviceTitleSnapshot
                          ? null
                          : ` · ${enquirySourceLabel(enquiry.source)}`}
                      </p>
                    </div>
                    <time className="text-[10px] text-muted shrink-0">
                      {formatAdminDateTime(enquiry.createdAt)}
                    </time>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted mb-3">
          Quick actions
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickAction
            to="/admin/products/$productId"
            params={{ productId: "new" }}
            icon={Package}
            label="Add product"
            desc="Create a new catalog item"
          />
          <QuickAction
            to="/admin/products"
            icon={Package}
            label="View products"
            desc={`${productCount} in catalog`}
          />
          <QuickAction
            to="/admin/settings"
            icon={Settings}
            label="Edit website"
            desc="Contact details & account"
          />
        </div>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat
          label="Contacted"
          value={enquiries.contacted}
          href="/admin/enquiries"
          search="contacted"
        />
        <MiniStat label="Quoted" value={enquiries.quoted} href="/admin/enquiries" search="quoted" />
        <MiniStat
          label="Confirmed"
          value={enquiries.confirmed}
          href="/admin/enquiries"
          search="confirmed"
        />
        <MiniStat label="All leads" value={enquiries.all} href="/admin/enquiries" search="all" />
      </section>
    </div>
  );
}

function QuickAction({
  to,
  params,
  icon: Icon,
  label,
  desc,
}: {
  to: "/admin/products" | "/admin/products/$productId" | "/admin/settings";
  params?: { productId: string };
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      params={params}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-surface/30 p-4 hover:border-foreground/30 hover:bg-surface/60 transition-all min-h-11"
    >
      <div className="w-9 h-9 rounded-lg border border-border flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted mt-0.5">{desc}</p>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:translate-x-0.5 transition-transform mt-auto" />
    </Link>
  );
}

function MiniStat({
  label,
  value,
  href,
  search,
}: {
  label: string;
  value: number;
  href: "/admin/enquiries";
  search: "all" | "contacted" | "quoted" | "confirmed";
}) {
  return (
    <Link
      to={href}
      search={{ status: search }}
      className="rounded-xl border border-border bg-surface/20 p-3 hover:bg-surface/50 transition-colors"
    >
      <p className="font-display text-2xl leading-none">{value}</p>
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted mt-1">{label}</p>
    </Link>
  );
}
