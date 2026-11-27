/** Only redirect crawlable public routes, not admin, server functions or uploads. */
function isPublicPath(path: string) {
  return (
    ["/", "/services", "/contact", "/custom", "/robots.txt", "/sitemap.xml"].includes(path) ||
    /^\/(?:catalog|blog)(?:\/[^/]+)?\/?$/.test(path) ||
    /^\/(?:services|contact|custom)\/$/.test(path)
  );
}

export function getCanonicalRedirect(
  request: Request,
  siteUrl: string | undefined,
  production: boolean,
): Response | undefined {
  if (!production || !siteUrl || !["GET", "HEAD"].includes(request.method)) return;

  let canonical: URL;
  try {
    canonical = new URL(siteUrl);
  } catch {
    return;
  }
  if (
    canonical.protocol !== "https:" ||
    canonical.hostname.startsWith("www.") ||
    !canonical.hostname.includes(".") ||
    canonical.port ||
    canonical.pathname !== "/" ||
    canonical.search ||
    canonical.hash ||
    canonical.username ||
    canonical.password
  ) {
    return;
  }

  const source = new URL(request.url);
  if (source.host !== `www.${canonical.host}` || !isPublicPath(source.pathname)) return;

  // Set URL fields separately to preserve the query and prevent an open redirect.
  canonical.pathname = source.pathname;
  canonical.search = source.search;
  return new Response(null, { status: 301, headers: { location: canonical.href } });
}
