import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";

import { AdminLaunchSplash } from "@/components/admin/AdminLaunchSplash";
import { AdminShell } from "@/components/admin/AdminShell";
import { sanitizeAdminNotificationUrl } from "@/lib/admin-push";
import { getSessionAdmin } from "@/lib/api/admin/auth";
import { getAdminEnquirySummary } from "@/lib/api/admin/enquiries";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/admin/login") {
      return { session: null };
    }

    const session = await getSessionAdmin();
    if (!session) {
      const nextCandidate = `${location.pathname}${location.searchStr || ""}`;
      const next = sanitizeAdminNotificationUrl(nextCandidate);
      throw redirect({
        to: "/admin/login",
        search: next ? { next } : {},
      });
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
  head: () => ({
    meta: [
      { title: "DaintyHand Admin" },
      { name: "application-name", content: "DaintyHand Admin" },
      { name: "apple-mobile-web-app-title", content: "DaintyHand Admin" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "theme-color", content: "#fdfbf7" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { session } = Route.useRouteContext();
  const { newEnquiryCount } = Route.useLoaderData();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      {/* Installed-app brand moment only; does not remount on child route changes. */}
      <AdminLaunchSplash />
      {pathname === "/admin/login" ? (
        <Outlet />
      ) : (
        <AdminShell userName={session?.name} newEnquiryCount={newEnquiryCount}>
          <Outlet />
        </AdminShell>
      )}
    </>
  );
}
