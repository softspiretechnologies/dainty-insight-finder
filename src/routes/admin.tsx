import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/AdminShell";
import { getSessionAdmin } from "@/lib/api/admin/auth";

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
  component: AdminLayout,
});

function AdminLayout() {
  const { session } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname === "/admin/login") {
    return <Outlet />;
  }

  return (
    <AdminShell userName={session?.name}>
      <Outlet />
    </AdminShell>
  );
}
