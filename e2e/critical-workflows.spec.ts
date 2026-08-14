import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test, type Page } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL || "e2e-admin@example.com";
const adminPassword = process.env.E2E_ADMIN_PASSWORD || "E2e-password-123!";
const fixture = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/assets/gallery-1.jpg",
);

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email address").fill(adminEmail);
  await page.getByLabel("Password").fill(adminPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
}

test("admin authentication rejects invalid credentials and revokes the current session", async ({
  page,
}) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email address").fill(adminEmail);
  await page.getByLabel("Password").fill("incorrect-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert")).toContainText("Invalid email or password");

  await login(page);
  await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible();
  await page.getByRole("button", { name: "Log out" }).first().click();
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
  await page
    .locator("tr")
    .filter({ hasText: originalName })
    .getByRole("link", { name: "Edit" })
    .click();
  await page.getByLabel("Product name").fill(editedName);
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.goto(`/catalog/${editedSlug}`);
  await expect(page.getByRole("heading", { name: editedName })).toBeVisible();

  await page.goto("/admin/products");
  await page
    .locator("tr")
    .filter({ hasText: editedName })
    .getByRole("link", { name: "Edit" })
    .click();
  await page.getByLabel("Listed on site").uncheck();
  await page.getByRole("button", { name: "Save changes" }).click();
  const hiddenResponse = await page.goto(`/catalog/${editedSlug}`);
  expect(hiddenResponse?.status()).toBe(404);
});

test("catalog filters and opens a product", async ({ page }) => {
  await page.goto("/catalog");
  await page.getByRole("button", { name: "Hampers" }).click();
  await expect(page).toHaveURL(/category=hampers/);
  await page.locator("article a").first().click();
  await expect(page).toHaveURL(/\/catalog\/[^/?]+/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
