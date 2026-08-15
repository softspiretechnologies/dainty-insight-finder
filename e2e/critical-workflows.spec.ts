import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test, type Page } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL || "e2e-admin@example.com";
const adminPassword = process.env.E2E_ADMIN_PASSWORD || "E2e-password-123!";
test.describe.configure({ timeout: 90_000 });
const fixture = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/assets/gallery-1.jpg",
);

async function waitForHydration(page: Page) {
  await expect(page.locator('html[data-hydrated="true"]')).toHaveCount(1, { timeout: 20_000 });
}

async function login(page: Page) {
  await page.goto("/admin/login");
  await waitForHydration(page);
  await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByLabel("Email address")).toBeFocused();
  await expect(page.getByLabel("Email address")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Email address")).toHaveAttribute("aria-describedby", "email-error");
  await page.getByLabel("Email address").fill(adminEmail);
  await page.getByLabel("Password").fill(adminPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
}

async function openProductEditor(page: Page, productName: string) {
  const editHref = await page
    .locator("tr")
    .filter({ hasText: productName })
    .getByRole("link", { name: "Edit" })
    .getAttribute("href");
  expect(editHref).toMatch(/^\/admin\/products\/\d+$/);
  await page.goto(editHref!);
  await waitForHydration(page);
}

test("admin authentication rejects invalid credentials and revokes the current session", async ({
  page,
}) => {
  await page.goto("/admin/login");
  await waitForHydration(page);
  await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();
  await page.getByLabel("Email address").fill(adminEmail);
  await page.getByLabel("Password").fill("incorrect-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Invalid email or password" }),
  ).toBeVisible({ timeout: 20_000 });

  await login(page);
  await expect(page.getByRole("heading", { name: /DaintyHand Admin/i })).toBeVisible();
  await page.getByRole("button", { name: "Log out" }).first().click();
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("tampered admin session cannot open protected routes", async ({ context, page }) => {
  await context.addCookies([
    { name: "dainty_admin_session", value: "tampered.payload", url: "http://127.0.0.1:4173" },
  ]);
  await page.goto("/admin/products");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("admin can create, edit, and hide a product", async ({ page }) => {
  const suffix = Date.now();
  const originalName = `E2E Gift ${suffix}`;
  const editedName = `${originalName} Edited`;
  const slug = `e2e-gift-${suffix}`;
  const editedSlug = `${slug}-edited`;

  await login(page);
  await page.goto("/admin/products/new");
  await waitForHydration(page);
  await page.getByLabel("Product name").fill(originalName);
  await page.getByLabel("Category").selectOption("hampers");
  await page.getByLabel("Short blurb").fill("Created by isolated E2E test data");
  await page
    .getByLabel("Full description")
    .fill("A temporary product used to verify the admin workflow.");
  await page.getByLabel("Details").fill("Reusable test fixture\nTemporary product");
  await page.locator('input[type="file"]').setInputFiles(fixture);
  await page.getByRole("button", { name: "Create product" }).click();
  await expect(page).toHaveURL(/\/admin\/products\/?$/);

  await page.goto(`/catalog/${slug}`);
  await expect(page.getByRole("heading", { name: originalName })).toBeVisible();

  await page.goto("/admin/products");
  await waitForHydration(page);
  await openProductEditor(page, originalName);
  await page.getByLabel("Product name").fill(editedName);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/\/admin\/products\/?$/);
  await page.goto(`/catalog/${editedSlug}`);
  await expect(page.getByRole("heading", { name: editedName })).toBeVisible();

  await page.goto("/admin/products");
  await waitForHydration(page);
  await openProductEditor(page, editedName);
  await page.getByLabel("Listed on site").uncheck();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/\/admin\/products\/?$/);
  const hiddenResponse = await page.goto(`/catalog/${editedSlug}`);
  expect(hiddenResponse?.status()).toBe(404);
});

test("catalog filters and opens a product", async ({ page }) => {
  await page.goto("/catalog");
  await waitForHydration(page);
  await page.getByRole("button", { name: "Hampers" }).click();
  await expect(page).toHaveURL(/category=hampers/);
  await page.locator("article a").first().click();
  await expect(page).toHaveURL(/\/catalog\/[^/?]+/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
