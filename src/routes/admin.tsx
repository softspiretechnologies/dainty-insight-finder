import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";

import { AdminLaunchSplash } from "@/components/admin/AdminLaunchSplash";
import { AdminShell } from "@/components/admin/AdminShell";
import { isAdminLoginPath, shouldValidateAdminSession } from "@/lib/admin-nav-load";
import { sanitizeAdminNotificationUrl } from "@/lib/admin-push";
import { getSessionAdmin } from "@/lib/api/admin/auth";
import { getAdminShellData } from "@/lib/api/admin/enquiries";

function loginRedirect(pathname: string, searchStr: string) {
  const nextCandidate = `${pathname}${searchStr || ""}`;
  const next = sanitizeAdminNotificationUrl(nextCandidate);
  return redirect({
    to: "/admin/login",
    search: next ? { next } : {},
  });
}

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location, cause }) => {
    if (!shouldValidateAdminSession(location.pathname, cause)) {
      return;
    }

    const session = await getSessionAdmin();
    if (!session) {
      throw loginRedirect(location.pathname, location.searchStr || "");
    }
  },
  staleTime: 15_000,
  loader: async ({ location }) => {
    if (isAdminLoginPath(location.pathname)) {
      return { user: null, newEnquiryCount: 0 };
    }
    try {
      return await getAdminShellData();
    } catch (error) {
      if (error instanceof Error && error.message === "Unauthorized") {
        throw loginRedirect(location.pathname, location.searchStr || "");
      }
      throw error;
    }
  },
  head: () => ({
    meta: [
      { title: "DaintyHand Admin" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "application-name", content: "DaintyHand Admin" },
      { name: "apple-mobile-web-app-title", content: "DaintyHand Admin" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "theme-color", content: "#fdfbf7" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, newEnquiryCount } = Route.useLoaderData();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      {/* Installed-app brand moment only; does not remount on child route changes. */}
      <AdminLaunchSplash />
      {isAdminLoginPath(pathname) ? (
        <Outlet />
      ) : (
        <AdminShell userName={user?.name} newEnquiryCount={newEnquiryCount}>
          <Outlet />
        </AdminShell>
      )}
    </>
  );
}
