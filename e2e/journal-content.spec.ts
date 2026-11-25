import { expect, test } from "@playwright/test";

const guides = [
  {
    slug: "custom-gift-hampers-perinthalmanna-ordering-guide",
    title: "How to Order a Custom Gift Hamper in Perinthalmanna, Malappuram",
    category: "hampers",
  },
  {
    slug: "cash-chocolate-bouquet-guide-malappuram",
    title: "Cash or Chocolate Bouquet? A Gift Guide for Malappuram",
    category: "bouquets",
  },
];

test("local buying guides are linked, crawlable and present in the sitemap", async ({
  page,
  request,
}) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  await page.goto("/blog");
  for (const guide of guides) {
    const path = `/blog/${guide.slug}`;
    await expect(page.getByRole("link", { name: guide.title })).toHaveAttribute("href", path);
    expect(xml).toContain(`${path}</loc>`);
  }
  for (const guide of guides) {
    const response = await page.goto(`/blog/${guide.slug}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(guide.title);
    await expect(page.getByRole("link", { name: "Browse Related Creations" })).toHaveAttribute(
      "href",
      `/catalog?category=${guide.category}`,
    );
  }
});
