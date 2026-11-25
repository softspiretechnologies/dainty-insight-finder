import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { site } from "@/lib/site";
import { buildSitemapXml } from "@/lib/sitemap";
import { getSitemapEntries } from "@/lib/sitemap.server";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const xml = buildSitemapXml(site.baseUrl, await getSitemapEntries());
          return new Response(xml, {
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "public, max-age=300",
            },
          });
        } catch {
          return new Response("Sitemap temporarily unavailable", {
            status: 503,
            headers: { "Cache-Control": "no-store", "Retry-After": "300" },
          });
        }
      },
    },
  },
});
