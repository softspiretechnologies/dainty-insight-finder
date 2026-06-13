import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { siteUrl } from "../lib/site";

function NotFoundComponent() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5">
      <div className="text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted block mb-4">404</span>
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

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5">
      <div className="text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted block mb-4">Error</span>
        <h1 className="font-display text-4xl sm:text-6xl italic tracking-tighter mb-4">
          Something went wrong.
        </h1>
        <p className="text-sm text-muted mb-10 max-w-xs mx-auto leading-relaxed">
          Something went wrong on our end. Try again or head back home.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => { router.invalidate(); reset(); }}
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

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "DaintyHand — Handcrafted Gifts & Wedding Studio" },
      { name: "description", content: "Custom hampers, bouquets, invitations and celebration services handcrafted by Nafisa in Perinthalmanna. We ship across India & worldwide." },
      { name: "author", content: "DaintyHand" },
      { property: "og:title", content: "DaintyHand — Handcrafted Gifts & Wedding Studio" },
      { property: "og:description", content: "Custom hampers, bouquets, invitations and celebration services handcrafted by Nafisa in Perinthalmanna. We ship across India & worldwide." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@dainty.handd" },
      { name: "twitter:title", content: "DaintyHand — Handcrafted Gifts & Wedding Studio" },
      { name: "twitter:description", content: "Custom hampers, bouquets, invitations and celebration services handcrafted with care and shipped across India & worldwide." },
      { property: "og:image", content: siteUrl("/og-image.jpg") },
      { name: "twitter:image", content: siteUrl("/og-image.jpg") },
    ],
    links: [
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,600&family=Inter:wght@400;500&family=JetBrains+Mono&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
