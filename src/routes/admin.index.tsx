import { createFileRoute, Link } from "@tanstack/react-router";

import { getAdminDashboardData } from "@/lib/api/catalog";

export const Route = createFileRoute("/admin/")({
  loader: () => getAdminDashboardData(),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { productCount } = Route.useLoaderData();

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl md:text-4xl italic tracking-tight mb-2">Dashboard</h1>
      <p className="text-sm text-muted mb-8 md:mb-10">Manage catalog products, categories and site settings.</p>

      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8 md:mb-10">
        <StatCard label="Products" value={String(productCount)} />
        <StatCard label="Categories" value="8" />
        <StatCard label="Status" value="Live" />
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
        <AdminLink to="/admin/products">Manage products</AdminLink>
        <AdminLink to="/admin/categories">Edit categories</AdminLink>
        <AdminLink to="/admin/settings">Site settings</AdminLink>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border rounded-lg p-3 md:p-5 bg-surface/30">
      <p className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.25em] text-muted">{label}</p>
      <p className="font-display text-xl md:text-3xl mt-1 md:mt-2">{value}</p>
    </div>
  );
}

function AdminLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-border px-5 py-3 sm:py-2.5 text-xs font-semibold uppercase tracking-widest hover:border-foreground transition-colors"
    >
      {children}
    </Link>
  );
}
