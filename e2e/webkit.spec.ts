import { expect, test, type Page } from "@playwright/test";

import { expectFocusInside, expectNoPageOverflow, login, visit } from "./helpers";

test.describe.configure({ timeout: 120_000 });

function onlyProject(projectName: string, actualProjectName: string) {
  test.skip(actualProjectName !== projectName, `Covered by the ${projectName} device profile`);
}

async function checkPublicMenuKeyboard(page: Page) {
  const trigger = page.getByRole("button", { name: "Open menu" });
  // Safari follows the OS "Press Tab to highlight each item" preference, so
  // link-by-link tab order is asserted in Chromium while WebKit verifies the
  // focused control, dialog trap, Escape, and focus restoration behavior.
  await trigger.focus();
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expectFocusInside(page, '[role="dialog"]');
  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press("Tab");
    await expectFocusInside(page, '[role="dialog"]');
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
}

test("Desktop Safari covers representative public critical paths", async ({ page }, testInfo) => {
  onlyProject("webkit-desktop", testInfo.project.name);
  await visit(page, "/");
  await expectNoPageOverflow(page);
  await expect(
    page.getByRole("navigation").getByRole("link", { name: "Past Creations" }),
  ).toBeVisible();

  await visit(page, "/catalog");
  await page.getByRole("button", { name: "Hampers" }).click();
  await expect(page).toHaveURL(/category=hampers/);
  await page.locator('article a[href^="/catalog/"]').first().click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectNoPageOverflow(page);
});

test("iPhone Safari covers portrait, landscape, sheets, fixed UI and form controls", async ({
  page,
}, testInfo) => {
  onlyProject("webkit-iphone", testInfo.project.name);

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 932, height: 430 },
  ]) {
    await page.setViewportSize(viewport);
    await visit(page, "/");
    await expectNoPageOverflow(page);
    await checkPublicMenuKeyboard(page);

    await page.getByTestId("whatsapp-toggle").click();
    const panel = page.getByTestId("whatsapp-panel");
    const box = await panel.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
    await panel.getByRole("button", { name: "Close chat" }).click();
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await visit(page, "/custom");
  const dateInput = page.getByLabel("Event date");
  await expect(dateInput).toBeVisible();
  await expect(dateInput).toHaveCSS("font-size", "16px");
  await dateInput.fill("2030-01-01");
  await expect(dateInput).toHaveValue("2030-01-01");

  const submit = page.getByRole("button", { name: "Continue on WhatsApp" });
  const keyboardFields = [
    page.getByLabel("Full name"),
    page.getByLabel("Phone / WhatsApp"),
    page.getByLabel("Email (optional)"),
    page.getByLabel("Service required"),
    page.getByLabel("Event type (wedding, birthday, engagement…)"),
    dateInput,
    page.getByLabel("Budget range (optional)"),
    page.getByLabel("Delivery location"),
    page.getByLabel("Description / the brief"),
  ];
  await keyboardFields[0].focus();
  for (const field of keyboardFields.slice(1)) {
    for (let step = 0; step < 6; step += 1) {
      await page.keyboard.press("Tab");
      if (await field.evaluate((element) => element === document.activeElement)) break;
    }
    await expect(field).toBeFocused();
  }
  await submit.focus();
  await expect(submit).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Please enter your full name")).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
});

test("iPad Safari covers authenticated admin navigation and keyboard focus", async ({
  page,
}, testInfo) => {
  onlyProject("webkit-ipad", testInfo.project.name);
  await page.setViewportSize({ width: 834, height: 1194 });
  await login(page);
  await expectNoPageOverflow(page);

  const trigger = page.getByRole("button", { name: "Open menu" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expectFocusInside(page, '[role="dialog"]');
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  for (const route of ["/admin/products", "/admin/products/new", "/admin/settings"]) {
    await visit(page, route);
    await expectNoPageOverflow(page);
  }

  await page.setViewportSize({ width: 1024, height: 768 });
  await visit(page, "/admin/products");
  await expectNoPageOverflow(page);
  await expect(page.getByRole("button", { name: "Open menu" })).toBeHidden();
});
