import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import { ADMIN_EARLY_BOOT_SCRIPT, ADMIN_EARLY_BOOT_STYLE } from "../lib/admin-early-boot";
import { EMPTY_ADMIN_ROOT_CONTEXT, shouldLoadPublicRootContext } from "../lib/admin-nav-load";
import { getRootPageData } from "../lib/api/catalog";
import { matchesIncludeAdmin, resolvePwaIdentity } from "../lib/pwa-identity";
import { siteUrl } from "../lib/site";
import { buildWebsiteStructuredData } from "../lib/business-seo";
import type { CatalogCategory, SiteSettingsData } from "../types/catalog";

const analyticsId = import.meta.env.VITE_GA_ID?.trim();

function NotFoundComponent() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5">
      <div className="text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted block mb-4">
          404
        </span>
        <h1 className="font-display text-5xl sm:text-7xl italic tracking-tighter mb-4">
          Page not found.
        </h1>
        <p className="text-sm text-muted mb-10 max-w-xs mx-auto leading-relaxed">
          That page doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-4 bg-foreground text-background px-7 py-4 rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-primary transition-all active:scale-95 group"
        >
          Go home
          <span className="w-5 h-px bg-background/40 group-hover:w-8 transition-all" />
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5">
      <div className="text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted block mb-4">
          Error
        </span>
        <h1 className="font-display text-4xl sm:text-6xl italic tracking-tighter mb-4">
          Something went wrong.
        </h1>
        <p className="text-sm text-muted mb-10 max-w-xs mx-auto leading-relaxed">
          Something went wrong on our end. Try again or head back home.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center gap-4 bg-foreground text-background px-7 py-4 rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-primary transition-all active:scale-95 group"
          >
            Try again
            <span className="w-5 h-px bg-background/40 group-hover:w-8 transition-all" />
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-3 border border-foreground/30 px-7 py-4 rounded-full text-xs font-semibold uppercase tracking-widest hover:border-foreground hover:bg-surface transition-all"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{
  categories: CatalogCategory[];
  siteSettings: SiteSettingsData;
}>()({
  beforeLoad: async ({ location }) => {
    if (!shouldLoadPublicRootContext(location.pathname)) {
      return EMPTY_ADMIN_ROOT_CONTEXT;
    }
    const { categories, siteSettings } = await getRootPageData();
    return { categories, siteSettings };
  },
  head: ({ matches }) => {
    const admin = matchesIncludeAdmin(matches);
    const identity = resolvePwaIdentity(admin);

    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: identity.title },
        {
          name: "description",
          content:
            "Custom hampers, bouquets, invitations and celebration services handcrafted by Nafisa in Perinthalmanna. We ship across India & worldwide.",
        },
        { name: "author", content: "DaintyHand" },
        { property: "og:site_name", content: "DaintyHand" },
        { property: "og:title", content: "DaintyHand — Handcrafted Gifts & Wedding Studio" },
        {
          property: "og:description",
          content:
            "Custom hampers, bouquets, invitations and celebration services handcrafted by Nafisa in Perinthalmanna. We ship across India & worldwide.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "DaintyHand — Handcrafted Gifts & Wedding Studio" },
        {
          name: "twitter:description",
          content:
            "Custom hampers, bouquets, invitations and celebration services handcrafted with care and shipped across India & worldwide.",
        },
        { property: "og:image", content: siteUrl("/og-image.jpg") },
        { property: "og:image:type", content: "image/jpeg" },
        { property: "og:image:width", content: "1080" },
        { property: "og:image:height", content: "1080" },
        { property: "og:image:alt", content: "DaintyHand logo" },
        { name: "twitter:image", content: siteUrl("/og-image.jpg") },
        { name: "theme-color", content: "#fdfbf7" },
        { name: "application-name", content: identity.applicationName },
        { name: "apple-mobile-web-app-title", content: identity.appleWebAppTitle },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "geo.region", content: "IN-KL" },
        { name: "geo.placename", content: "Perinthalmanna" },
      ],
      links: [
        { rel: "icon", href: "/favicon.png", type: "image/png", sizes: "32x32" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
        { rel: "manifest", href: identity.manifestHref },
        { rel: "stylesheet", href: appCss },
      ],
      scripts: [
        ...(admin
          ? []
          : [
              {
                type: "application/ld+json",
                children: JSON.stringify(buildWebsiteStructuredData()),
              },
            ]),
        ...(analyticsId
          ? [
              { src: `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`, async: true },
              {
                children: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config',${JSON.stringify(analyticsId)},{anonymize_ip:true});`,
              },
            ]
          : []),
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" style={{ backgroundColor: "#fdfbf7", colorScheme: "light" }}>
      <head>
        <meta name="color-scheme" content="light" />
        <style dangerouslySetInnerHTML={{ __html: ADMIN_EARLY_BOOT_STYLE }} />
        <script dangerouslySetInnerHTML={{ __html: ADMIN_EARLY_BOOT_SCRIPT }} />
        <HeadContent />
      </head>
      <body style={{ backgroundColor: "#fdfbf7" }}>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = "true";
    return () => {
      delete document.documentElement.dataset.hydrated;
    };
  }, []);

  return <Outlet />;
}
