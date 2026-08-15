import { createFileRoute, Outlet } from "@tanstack/react-router";

import { FormErrorBanner } from "@/components/admin/AdminField";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/blog")({
  component: () => <Outlet />,
  errorComponent: ({ error, reset }) => (
    <div className="space-y-4">
      <h1 className="font-display text-3xl italic">Blog</h1>
      <FormErrorBanner message={error.message || "The blog page could not be loaded."} />
      <Button type="button" variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  ),
});
