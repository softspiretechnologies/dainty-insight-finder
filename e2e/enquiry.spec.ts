import { expect, test, type Page } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL || "e2e-admin@example.com";
const adminPassword = process.env.E2E_ADMIN_PASSWORD || "E2e-password-123!";
test.describe.configure({ timeout: 90_000 });

async function waitForHydration(page: Page) {
  await expect(page.locator('html[data-hydrated="true"]')).toHaveCount(1, { timeout: 20_000 });
}

async function login(page: Page) {
  await page.goto("/admin/login");
  await waitForHydration(page);
  await page.getByLabel("Email address").fill(adminEmail);
  await page.getByLabel("Password").fill(adminPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
}

test("public enquiry submits and appears in admin", async ({ page }) => {
  const suffix = Date.now();
  const name = `E2E Lead ${suffix}`;
  const phone = `98${String(suffix).slice(-8)}`;

  await page.goto("/contact");
  await waitForHydration(page);
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("WhatsApp number").fill(phone);
  await page
    .getByLabel("What are you looking for?")
    .fill("E2E wedding hamper enquiry for testing.");
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByText("Enquiry sent")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("link", { name: /Continue on WhatsApp/i })).toBeVisible();

  await login(page);
  await page.goto("/admin/enquiries");
  await waitForHydration(page);
  await expect(page.getByRole("heading", { name: "Enquiries" })).toBeVisible();
  await expect(page.getByText(name)).toBeVisible({ timeout: 20_000 });
  await page.getByRole("link", { name: new RegExp(name) }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await page.locator("#enquiry-status").selectOption("contacted");
  await page.getByRole("button", { name: "Update status" }).click();
  await expect(page.getByText("Status updated.")).toBeVisible({ timeout: 15_000 });
});
