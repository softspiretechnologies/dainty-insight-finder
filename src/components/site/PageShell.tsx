import type { ReactNode } from "react";
import { useRouteContext } from "@tanstack/react-router";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { FloatingWhatsApp } from "./FloatingWhatsApp";

export function PageShell({ children }: { children: ReactNode }) {
  const { categories, siteSettings } = useRouteContext({ from: "__root__" });

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-background rounded-full font-mono text-xs uppercase tracking-widest"
      >
        Skip to main content
      </a>
      <SiteHeader />
      <main
        id="main-content"
        className="min-w-0 max-w-full lg:pb-0!"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 5rem)" }}
      >
        {children}
      </main>
      <SiteFooter />
      <FloatingWhatsApp categories={categories} siteSettings={siteSettings} />
    </div>
  );
}
