const paths = [
  "/",
  "/catalog",
  "/services",
  "/blog",
  "/sitemap.xml",
  "/robots.txt",
  "/health",
  "/admin/login",
];

async function main() {
  const rawBaseUrl = process.env.SITE_URL?.trim();
  if (!rawBaseUrl) throw new Error("SITE_URL is required (for example https://daintyhand.in)");
  const baseUrl = new URL(rawBaseUrl);
  if (!/^https?:$/.test(baseUrl.protocol)) throw new Error("SITE_URL must use HTTP or HTTPS");

  const failures: string[] = [];
  for (const path of paths) {
    const url = new URL(path, baseUrl);
    try {
      const response = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) failures.push(`${url.toString()} returned ${response.status}`);
      else console.log(`OK ${response.status} ${url.toString()}`);
    } catch (error) {
      failures.push(
        `${url.toString()} failed: ${error instanceof Error ? error.message : "request error"}`,
      );
    }
  }

  if (failures.length > 0) {
    for (const failure of failures) console.error(`FAIL ${failure}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
