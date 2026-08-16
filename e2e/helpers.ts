import { expect, type Page } from "@playwright/test";

export const adminEmail = process.env.E2E_ADMIN_EMAIL || "e2e-admin@example.com";
export const adminPassword = process.env.E2E_ADMIN_PASSWORD || "E2e-password-123!";

export async function waitForHydration(page: Page) {
  await expect(page.locator('html[data-hydrated="true"]')).toHaveCount(1, { timeout: 20_000 });
  await page.evaluate(async () => {
    await Promise.race([
      document.fonts.ready,
      new Promise<void>((resolve) => window.setTimeout(resolve, 2_000)),
    ]);
  });
}

export async function visit(page: Page, route: string) {
  await page.goto(route);
  await waitForHydration(page);
}

/** Login password input only — `getByLabel("Password")` also matches "Show password". */
export function passwordField(page: Page) {
  return page.locator("#password");
}

export async function login(page: Page) {
  await visit(page, "/admin/login");
  await page.getByLabel("Email address").fill(adminEmail);
  await passwordField(page).fill(adminPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
}

export async function expectNoPageOverflow(page: Page) {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const root = document.documentElement;
          return root.scrollWidth > root.clientWidth + 1;
        }),
      { message: `Expected ${page.url()} not to have document-level horizontal overflow` },
    )
    .toBe(false);
}

export async function expectFocusInside(page: Page, selector: string) {
  await expect
    .poll(() =>
      page.evaluate((containerSelector) => {
        const container = document.querySelector(containerSelector);
        return Boolean(
          container && document.activeElement && container.contains(document.activeElement),
        );
      }, selector),
    )
    .toBe(true);
}
