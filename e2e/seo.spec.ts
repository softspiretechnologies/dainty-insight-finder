import { expect, test } from "@playwright/test";

test("single category metadata is server rendered and canonical", async ({ page }) => {
  const response = await page.goto("/catalog?category=hampers");
  expect(response?.status()).toBe(200);
  const html = await response!.text();
  expect(html).toContain("Custom Gift Hampers in Malappuram");
  await expect(page).toHaveTitle(/Custom Gift Hampers in Malappuram/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Custom Gift Hampers in Malappuram");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/catalog\?category=hampers$/,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
});

test("admin login advertises noindex in its server-rendered response", async ({ request }) => {
  const response = await request.get("/admin/login");
  expect(response.status()).toBe(200);
  expect(await response.text()).toMatch(/<meta[^>]*name="robots"[^>]*content="noindex, nofollow"/);
});

test("sitemap includes populated category and excludes admin pages", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/xml");
  const xml = await response.text();
  expect(xml).toContain("/catalog?category=hampers</loc>");
  expect(xml).not.toContain("/admin");
});
