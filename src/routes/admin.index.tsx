import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Package,
  Tags,
  Settings,
  MessageCircle,
  ArrowRight,
  TrendingUp,
  Sparkles,
  MessageSquareQuote,
  Inbox,
} from "lucide-react";

import { getAdminDashboardData } from "@/lib/api/catalog";
import { getAdminEnquirySummary } from "@/lib/api/admin/enquiries";
import { ENQUIRY_STATUS_LABELS, enquiryInterestLabel } from "@/lib/enquiries";

export const Route = createFileRoute("/admin/")({
  loader: async () => {
    const [dashboard, enquiries] = await Promise.all([
      getAdminDashboardData(),
      getAdminEnquirySummary(),
    ]);
    return { ...dashboard, enquiries };
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  const { productCount, enquiries } = Route.useLoaderData();

  const quickLinks = [
    {
      to: "/admin/enquiries",
      icon: Inbox,
      label: "Enquiries",
      desc: "Review new leads and follow up",
      accent: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      to: "/admin/products",
      icon: Package,
      label: "Products",
      desc: "Add, edit or remove catalog items",
      accent: "bg-orange-50 text-orange-700 border-orange-200",
    },
    {
      to: "/admin/categories",
      icon: Tags,
      label: "Categories",
      desc: "Update labels, blurbs and images",
      accent: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      to: "/admin/services",
      icon: Sparkles,
      label: "Services",
      desc: "Edit the celebration services page",
      accent: "bg-violet-50 text-violet-700 border-violet-200",
    },
    {
      to: "/admin/testimonials",
      icon: MessageSquareQuote,
      label: "Testimonials",
      desc: "Manage homepage customer quotes",
      accent: "bg-rose-50 text-rose-700 border-rose-200",
    },
    {
      to: "/admin/settings",
      icon: Settings,
      label: "Settings",
      desc: "WhatsApp, email & contact info",
      accent: "bg-sky-50 text-sky-700 border-sky-200",
    },
  ] as const;

  return (
    <div className="max-w-3xl space-y-8 md:space-y-10">
      <div>
        <h1 className="font-display text-3xl md:text-5xl italic tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted mt-1.5">
          Manage enquiries, catalog, and contact settings.
        </p>
      </div>

      <div className="grid grid-cols-2 min-[400px]:grid-cols-4 gap-3">
        <StatCard
          label="New"
          value={String(enquiries.new)}
          icon={<Inbox className="w-4 h-4" />}
          href="/admin/enquiries"
          search={{ status: "new" }}
        />
        <StatCard
          label="Contacted"
          value={String(enquiries.contacted)}
          icon={<MessageCircle className="w-4 h-4" />}
          href="/admin/enquiries"
          search={{ status: "contacted" }}
        />
        <StatCard
          label="Quoted"
          value={String(enquiries.quoted)}
          icon={<TrendingUp className="w-4 h-4" />}
          href="/admin/enquiries"
          search={{ status: "quoted" }}
        />
        <StatCard
          label="Confirmed"
          value={String(enquiries.confirmed)}
          icon={<Package className="w-4 h-4" />}
          href="/admin/enquiries"
          search={{ status: "confirmed" }}
        />
      </div>

      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
        <StatCard
          label="Products"
          value={String(productCount)}
          icon={<Package className="w-4 h-4" />}
          href="/admin/products"
        />
        <StatCard label="Status" value="Live" icon={<TrendingUp className="w-4 h-4" />} badge />
      </div>

      {enquiries.recent.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
              Recent enquiries
            </p>
            <Link to="/admin/enquiries" className="text-xs text-muted hover:text-foreground">
              View all →
            </Link>
          </div>
          <div className="border border-border rounded-xl divide-y divide-border overflow-hidden">
            {enquiries.recent.map((enquiry) => (
              <Link
                key={enquiry.id}
                to="/admin/enquiries/$enquiryId"
                params={{ enquiryId: String(enquiry.id) }}
                className="block p-3 sm:p-4 hover:bg-surface/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{enquiry.name}</p>
                    <p className="text-xs text-muted mt-0.5 truncate">
                      {enquiryInterestLabel(enquiry)} ·{" "}
                      {ENQUIRY_STATUS_LABELS[
                        enquiry.status as keyof typeof ENQUIRY_STATUS_LABELS
                      ] ?? enquiry.status}
                    </p>
                  </div>
                  <time className="text-[10px] text-muted font-mono shrink-0">
                    {new Date(enquiry.createdAt).toLocaleDateString()}
                  </time>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted mb-3">
          Quick actions
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group flex flex-col gap-3 rounded-xl border border-border bg-surface/30 p-4 hover:border-foreground/30 hover:bg-surface/60 transition-all"
            >
              <div
                className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${item.accent}`}
              >
                <item.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm leading-snug">{item.label}</p>
                <p className="text-xs text-muted mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-foreground group-hover:translate-x-0.5 transition-all mt-auto" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  href,
  search,
  badge,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  href?: "/admin/enquiries" | "/admin/products";
  search?: { status?: "new" | "contacted" | "quoted" | "confirmed" | "lost" | "all" };
  badge?: boolean;
}) {
  const content = (
    <div className="border border-border rounded-xl p-3 sm:p-5 bg-surface/30 flex flex-col gap-2 hover:bg-surface/60 transition-colors h-full">
      <div className="text-muted">{icon}</div>
      <div>
        <p className="font-display text-2xl sm:text-3xl leading-none">
          {badge ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              {value}
            </span>
          ) : (
            value
          )}
        </p>
        <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-muted mt-1">
          {label}
        </p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link to={href} search={search} className="block">
        {content}
      </Link>
    );
  }
  return content;
}
