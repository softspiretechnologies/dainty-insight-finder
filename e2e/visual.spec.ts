import { expect, test, type Page } from "@playwright/test";

import { login, visit } from "./helpers";

test.describe.configure({ timeout: 120_000 });

async function prepare(page: Page, route: string) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await visit(page, route);
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          [...document.images]
            .filter((image) => {
              const rect = image.getBoundingClientRect();
              return (
                rect.width > 0 &&
                rect.height > 0 &&
                rect.bottom >= 0 &&
                rect.top <= window.innerHeight
              );
            })
            .every((image) => image.complete),
        ),
      { message: `Visible images did not settle on ${route}`, timeout: 15_000 },
    )
    .toBe(true);
  await page.evaluate(async () => {
    const visibleImages = [...document.images].filter((image) => {
      const rect = image.getBoundingClientRect();
      return (
        rect.width > 0 && rect.height > 0 && rect.bottom >= 0 && rect.top <= window.innerHeight
      );
    });
    await Promise.all(visibleImages.map((image) => image.decode().catch(() => undefined)));
  });
}

async function screenshot(page: Page, name: string) {
  await expect(page).toHaveScreenshot(name, {
    animations: "disabled",
    caret: "hide",
    maxDiffPixelRatio: 0.01,
  });
}

test("public visual baselines", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await prepare(page, "/");
  await screenshot(page, "homepage-desktop.png");

  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page, "/");
  await screenshot(page, "homepage-mobile.png");

  await page.setViewportSize({ width: 320, height: 568 });
  await prepare(page, "/catalog");
  await screenshot(page, "catalog-320.png");

  const productHref = await page
    .locator('article a[href^="/catalog/"]')
    .first()
    .getAttribute("href");
  expect(productHref).toBeTruthy();
  await prepare(page, productHref!);
  await screenshot(page, "product-detail-mobile.png");

  await prepare(page, "/custom");
  await screenshot(page, "custom-order-mobile.png");

  await page.setViewportSize({ width: 844, height: 390 });
  await prepare(page, "/");
  await page.getByTestId("whatsapp-toggle").click();
  await expect(page.getByTestId("whatsapp-panel")).toBeVisible();
  await screenshot(page, "whatsapp-landscape.png");
});

test("admin visual baselines", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await login(page);
  await prepare(page, "/admin/products");
  await screenshot(page, "admin-products-tablet-portrait.png");

  await page.setViewportSize({ width: 1024, height: 768 });
  await prepare(page, "/admin/products");
  await screenshot(page, "admin-products-tablet-landscape.png");

  await page.setViewportSize({ width: 1280, height: 800 });
  await prepare(page, "/admin/products");
  await screenshot(page, "admin-products-table-desktop.png");

  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page, "/admin/products/new");
  await screenshot(page, "admin-product-form-mobile.png");

  await prepare(page, "/admin/settings");
  await screenshot(page, "admin-settings-mobile.png");
});
