import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getSitemapProducts } from "@/lib/api/catalog";
import { site } from "@/lib/site";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const products = await getSitemapProducts();
        const staticPaths = ["/", "/services", "/catalog", "/custom", "/contact"];
        const productPaths = products.map((p) => `/catalog/${p.slug}`);
        const all = [...staticPaths, ...productPaths];

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...all.map(
            (path) =>
              `  <url>\n    <loc>${site.baseUrl}${path}</loc>\n    <changefreq>weekly</changefreq>\n  </url>`,
          ),
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});