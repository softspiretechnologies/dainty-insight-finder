import type { ReactNode } from "react";
import { useRouteContext } from "@tanstack/react-router";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { FloatingWhatsApp } from "./FloatingWhatsApp";

export function PageShell({ children }: { children: ReactNode }) {
  const { categories, siteSettings } = useRouteContext({ from: "__root__" });

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <FloatingWhatsApp categories={categories} siteSettings={siteSettings} />
    </div>
  );
}