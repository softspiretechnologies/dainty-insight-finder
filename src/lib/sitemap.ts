import { catalogPath, isSeoCategory } from "./catalog-seo";

type Product = { slug: string; category: string; updatedAt?: Date | null };
type Blog = { slug: string; updatedAt?: Date | null };
type Entry = { path: string; updatedAt?: Date | null };

export function buildSitemapEntries(
  products: readonly Product[],
  blogs: readonly Blog[],
  categoryIds: readonly string[],
): Entry[] {
  const paths = ["/", "/services", "/catalog", "/custom", "/contact", "/blog"];
  const entries: Entry[] = paths.map((path) => ({ path }));
  const populated = new Set(products.map((product) => product.category));
  for (const category of categoryIds) {
    if (isSeoCategory(category) && populated.has(category)) {
      entries.push({ path: catalogPath(category) });
    }
  }
  for (const product of products) {
    entries.push({
      path: `/catalog/${encodeURIComponent(product.slug)}`,
      updatedAt: product.updatedAt,
    });
  }
  for (const blog of blogs) {
    entries.push({ path: `/blog/${encodeURIComponent(blog.slug)}`, updatedAt: blog.updatedAt });
  }
  return [...new Map(entries.map((entry) => [entry.path, entry])).values()];
}

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;",
    };
    return entities[char];
  });
}

export function buildSitemapXml(baseUrl: string, entries: readonly Entry[]) {
  const base = baseUrl.replace(/\/$/, "");
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((entry) => {
      const lastmod =
        entry.updatedAt && Number.isFinite(entry.updatedAt.getTime())
          ? `\n    <lastmod>${entry.updatedAt.toISOString()}</lastmod>`
          : "";
      return `  <url>\n    <loc>${escapeXml(base + entry.path)}</loc>${lastmod}\n  </url>`;
    }),
    "</urlset>",
  ].join("\n");
}
