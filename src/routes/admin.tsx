import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/AdminShell";
import { getSessionAdmin } from "@/lib/api/admin/auth";
import { getAdminEnquirySummary } from "@/lib/api/admin/enquiries";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/admin/login") {
      return { session: null };
    }

    const session = await getSessionAdmin();
    if (!session) {
      throw redirect({ to: "/admin/login" });
    }

    return { session };
  },
  loader: async ({ location }) => {
    if (location.pathname === "/admin/login") {
      return { newEnquiryCount: 0 };
    }
    try {
      const summary = await getAdminEnquirySummary();
      return { newEnquiryCount: summary.new };
    } catch {
      return { newEnquiryCount: 0 };
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { session } = Route.useRouteContext();
  const { newEnquiryCount } = Route.useLoaderData();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname === "/admin/login") {
    return <Outlet />;
  }

  return (
    <AdminShell userName={session?.name} newEnquiryCount={newEnquiryCount}>
      <Outlet />
    </AdminShell>
  );
}
