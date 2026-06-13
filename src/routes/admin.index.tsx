import { createFileRoute, Link } from "@tanstack/react-router";
import { Package, Tags, Settings, MessageCircle, ArrowRight, TrendingUp, Sparkles } from "lucide-react";

import { getAdminDashboardData } from "@/lib/api/catalog";

export const Route = createFileRoute("/admin/")({
  loader: () => getAdminDashboardData(),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { productCount } = Route.useLoaderData();

  const quickLinks = [
    {
      to: "/admin/products",
      icon: Package,
      label: "Products",
      desc: "Add, edit or remove catalog items",
      accent: "bg-amber-50 text-amber-700 border-amber-200",
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
      to: "/admin/settings",
      icon: Settings,
      label: "Settings",
      desc: "WhatsApp, email & contact info",
      accent: "bg-sky-50 text-sky-700 border-sky-200",
    },
  ] as const;

  return (
    <div className="max-w-3xl space-y-8 md:space-y-10">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl md:text-5xl italic tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted mt-1.5">Manage your catalog, categories and contact settings.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Products"
          value={String(productCount)}
          icon={<Package className="w-4 h-4" />}
          href="/admin/products"
        />
        <StatCard
          label="Categories"
          value="8"
          icon={<Tags className="w-4 h-4" />}
          href="/admin/categories"
        />
        <StatCard
          label="Status"
          value="Live"
          icon={<TrendingUp className="w-4 h-4" />}
          badge
        />
      </div>

      {/* Quick actions */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted mb-3">Quick actions</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group flex flex-col gap-3 rounded-xl border border-border bg-surface/30 p-4 hover:border-foreground/30 hover:bg-surface/60 transition-all"
            >
              <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${item.accent}`}>
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

      {/* WhatsApp shortcut */}
      <div className="rounded-xl border border-border bg-surface/20 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
        <div className="w-10 h-10 rounded-full bg-[#25d366]/10 border border-[#25d366]/30 flex items-center justify-center shrink-0">
          <MessageCircle className="w-5 h-5 text-[#25d366]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Check enquiries</p>
          <p className="text-xs text-muted mt-0.5">Customer orders come in via WhatsApp — open it to reply.</p>
        </div>
        <a
          href="https://web.whatsapp.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest border border-border rounded-full px-4 py-2.5 hover:border-foreground transition-colors shrink-0"
        >
          Open WhatsApp
          <ArrowRight className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  href,
  badge,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  href?: string;
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
        <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-muted mt-1">{label}</p>
      </div>
    </div>
  );

  if (href) {
    return <Link to={href} className="block">{content}</Link>;
  }
  return content;
}
