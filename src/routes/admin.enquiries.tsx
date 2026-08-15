import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/enquiries")({
  component: () => <Outlet />,
});
