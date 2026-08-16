import { expect, test, type Page } from "@playwright/test";

import { adminEmail, adminPassword, passwordField } from "./helpers";

test.describe.configure({ timeout: 120_000 });

const requiredViewports = [
  { name: "small-mobile", width: 320, height: 568 },
  { name: "standard-mobile-360", width: 360, height: 800 },
  { name: "standard-mobile-375", width: 375, height: 812 },
  { name: "standard-mobile-390", width: 390, height: 844 },
  { name: "large-mobile", width: 430, height: 932 },
  { name: "tablet-portrait", width: 768, height: 1024 },
  { name: "tablet-landscape", width: 1024, height: 768 },
  { name: "small-laptop", width: 1280, height: 800 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

const publicRoutes = ["/", "/catalog", "/services", "/custom", "/contact", "/blog"];

async function waitForResponsiveLayout(page: Page) {
  await expect(page.locator('html[data-hydrated="true"]')).toHaveCount(1, { timeout: 20_000 });
  await page.evaluate(async () => {
    await Promise.race([
      document.fonts.ready,
      new Promise<void>((resolve) => window.setTimeout(resolve, 2_000)),
    ]);
  });
}

async function expectNoPageOverflow(page: Page) {
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

async function visitAndCheck(page: Page, route: string) {
  await page.goto(route);
  await waitForResponsiveLayout(page);
  await expectNoPageOverflow(page);
}

async function login(page: Page) {
  await page.goto("/admin/login");
  await waitForResponsiveLayout(page);
  await expectNoPageOverflow(page);
  await page.getByLabel("Email address").fill(adminEmail);
  await passwordField(page).fill(adminPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
}

for (const viewport of requiredViewports) {
  test(`public routes fit ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);

    for (const route of publicRoutes) await visitAndCheck(page, route);

    await page.goto("/catalog");
    await waitForResponsiveLayout(page);
    const productHref = await page
      .locator('article a[href^="/catalog/"]')
      .first()
      .getAttribute("href");
    expect(productHref).toBeTruthy();
    await visitAndCheck(page, productHref!);

    await page.goto("/blog");
    await waitForResponsiveLayout(page);
    const postHref = await page.locator('article a[href^="/blog/"]').first().getAttribute("href");
    expect(postHref).toBeTruthy();
    await visitAndCheck(page, postHref!);

    await visitAndCheck(page, "/missing-responsive-route");
    await expect(page.getByRole("heading", { name: "Page not found." })).toBeVisible();
  });
}

test("public navigation remains accessible on phone, tablet and desktop", async ({ page }) => {
  for (const viewport of [requiredViewports[0], requiredViewports[5]]) {
    await page.setViewportSize(viewport);
    await visitAndCheck(page, "/");

    const menuButton = page.getByRole("button", { name: "Open menu" });
    await expect(menuButton).toBeVisible();
    await expect(menuButton).toHaveCSS("width", "44px");
    await expect(menuButton).toHaveCSS("height", "44px");
    await menuButton.click();

    const menu = page.getByRole("dialog");
    await expect(menu).toBeVisible();
    const menuBox = await menu.boundingBox();
    expect(menuBox).not.toBeNull();
    expect(menuBox!.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(menuBox!.height).toBeLessThanOrEqual(viewport.height + 1);
    await expect(menu.getByRole("link", { name: "Past Creations" })).toBeVisible();
    await menu.getByRole("link", { name: "Services" }).click();
    await expect(page).toHaveURL(/\/services\/?$/);
    await expect(menu).toBeHidden();
  }

  await page.setViewportSize(requiredViewports[8]);
  await visitAndCheck(page, "/");
  await expect(page.getByRole("button", { name: "Open menu" })).toBeHidden();
  await expect(
    page.getByRole("navigation").getByRole("link", { name: "Past Creations" }),
  ).toBeVisible();
});

test("public mobile header follows a usable keyboard tab order", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await visitAndCheck(page, "/");

  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  const logo = page.getByRole("link", { name: "DaintyHand", exact: true });
  const menuButton = page.getByRole("button", { name: "Open menu" });
  await skipLink.focus();
  await page.keyboard.press("Tab");
  await expect(logo).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(menuButton).toBeFocused();
});

test("custom order controls and submit remain keyboard reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await visitAndCheck(page, "/custom");

  const submit = page.getByRole("button", { name: "Continue on WhatsApp" });
  const fields = [
    page.getByLabel("Full name"),
    page.getByLabel("Phone / WhatsApp"),
    page.getByLabel("Email (optional)"),
    page.getByLabel("Service required"),
    page.getByLabel("Event type (wedding, birthday, engagement…)"),
    page.getByLabel("Event date"),
    page.getByLabel("Budget range (optional)"),
    page.getByLabel("Delivery location"),
    page.getByLabel("Description / the brief"),
    submit,
  ];
  await fields[0].focus();
  for (const field of fields.slice(1)) {
    for (let step = 0; step < 6; step += 1) {
      await page.keyboard.press("Tab");
      if (await field.evaluate((element) => element === document.activeElement)) break;
    }
    await expect(field).toBeFocused();
  }

  await page.keyboard.press("Enter");
  await expect(page.getByText("Please enter your full name")).toBeVisible();
  await expect(page.getByLabel("Full name")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Full name")).toHaveAttribute("aria-describedby", "name-error");
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
});

test("floating WhatsApp panel stays inside phone and landscape viewports", async ({ page }) => {
  for (const viewport of [
    requiredViewports[0],
    { name: "mobile-landscape-844", width: 844, height: 390 },
    { name: "mobile-landscape-932", width: 932, height: 430 },
  ]) {
    await page.setViewportSize(viewport);
    await visitAndCheck(page, "/");
    await page.getByTestId("whatsapp-toggle").click();

    const panel = page.getByTestId("whatsapp-panel");
    await expect(panel).toBeVisible();
    const box = await panel.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);

    const body = page.getByTestId("whatsapp-panel-body");
    await expect(body).toHaveCSS("overflow-y", "auto");
    await expect(panel.getByRole("button", { name: "Close chat" })).toBeVisible();
    await panel.getByRole("button", { name: "Close chat" }).click();
  }
});

const adminViewports = [
  { name: "phone", width: 375, height: 812 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "tablet-820", width: 820, height: 1180 },
  { name: "tablet-landscape", width: 1024, height: 768 },
] as const;

const adminRoutes = [
  { path: "/admin", heading: "DaintyHand Admin" },
  { path: "/admin/products", heading: "Products" },
  { path: "/admin/products/new", heading: "New product" },
  { path: "/admin/categories", heading: "Categories" },
  { path: "/admin/services", heading: "Services" },
  { path: "/admin/testimonials", heading: "Testimonials" },
  { path: "/admin/settings", heading: "Site settings" },
  { path: "/admin/blog", heading: "Blog" },
  { path: "/admin/blog/new", heading: "New post" },
] as const;

for (const viewport of adminViewports) {
  test(`admin routes fit ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await login(page);

    for (const route of adminRoutes) {
      await visitAndCheck(page, route.path);
      await expect(
        page.getByRole("heading", { name: route.heading, exact: true }).first(),
      ).toBeVisible();
    }

    await visitAndCheck(page, "/admin/products");
    await expect(page.getByTestId("product-card-list")).toBeVisible();
    await expect(page.getByTestId("product-table")).toBeHidden();

    if (viewport.width < 1024) {
      const adminNav = page.getByRole("navigation", { name: "Admin" });
      await expect(adminNav).toBeVisible();
      await expect(adminNav.getByRole("link", { name: "Home" })).toBeVisible();
      await expect(adminNav.getByRole("link", { name: "Enquiries" })).toBeVisible();
      await expect(adminNav.getByRole("link", { name: "Products" })).toBeVisible();
      await expect(page.getByRole("button", { name: "More menu" })).toBeVisible();
    } else {
      await expect(page.getByRole("button", { name: "More menu" })).toBeHidden();
      await expect(page.getByRole("link", { name: "Home" }).first()).toBeVisible();
    }
  });
}

test("mobile admin bottom navigation reaches Home, Enquiries, Products, More, Settings", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await login(page);

  const adminNav = page.getByRole("navigation", { name: "Admin" });
  await expect(adminNav.getByRole("link", { name: "Home" })).toBeVisible();
  await adminNav.getByRole("link", { name: "Enquiries" }).click();
  await expect(page).toHaveURL(/\/admin\/enquiries/);
  await adminNav.getByRole("link", { name: "Products" }).click();
  await expect(page).toHaveURL(/\/admin\/products/);

  const more = page.getByRole("button", { name: "More menu" });
  await more.click();
  const sheet = page.getByRole("dialog");
  await expect(sheet).toBeVisible();
  await sheet.getByRole("link", { name: "Settings" }).click();
  await expect(page).toHaveURL(/\/admin\/settings/);
  await expect(page.getByRole("heading", { name: "Site settings" })).toBeVisible();
  await expect(page.getByText("Notifications", { exact: true })).toBeVisible();
  await expect(page.getByText("Get notified when a customer sends a new enquiry.")).toBeVisible();
});

test("mobile product more uses a sheet and keeps delete confirmation", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await login(page);
  await visitAndCheck(page, "/admin/products");

  await expect(page.locator("header").getByRole("link", { name: /new enquiries/i })).toHaveCount(0);

  const firstCard = page.getByTestId("product-card-list").locator("article").first();
  await firstCard.getByRole("button", { name: /More actions for/ }).click();

  const actions = page.getByRole("dialog").filter({ hasText: "Product actions" });
  await expect(actions).toBeVisible();
  await actions.getByRole("button", { name: "Delete product" }).click();
  await expect(actions).toBeHidden();

  const confirm = page.getByRole("dialog").filter({ hasText: /Delete "/ });
  await expect(confirm).toBeVisible();
  await confirm.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(confirm).toBeHidden();
  await expect(firstCard).toBeVisible();
});

test("admin product filters stay in the URL after opening a product and going back", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await visitAndCheck(page, "/admin/products");

  await page.getByRole("button", { name: "Visible", exact: true }).click();
  await expect(page).toHaveURL(/status=active/);

  const firstCard = page.getByTestId("product-card-list").locator("article").first();
  await firstCard.getByRole("link", { name: "Edit" }).click();
  await expect(page).toHaveURL(/\/admin\/products\/\d+/);
  await page.getByRole("button", { name: /Products/ }).click();
  await expect(page).toHaveURL(/\/admin\/products/);
  await expect(page).toHaveURL(/status=active/);
});

test("the desktop product table appears only with sufficient width", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await login(page);
  await visitAndCheck(page, "/admin/products");
  await expect(page.getByTestId("product-card-list")).toBeHidden();
  await expect(page.getByTestId("product-table")).toBeVisible();
});

test("primary mobile controls retain practical touch targets", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await visitAndCheck(page, "/catalog");

  const category = page.getByRole("button", { name: "Custom Hampers" });
  await expect(category).toBeVisible();
  expect((await category.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await category.click();
  const removeCategory = page.getByRole("button", { name: "Remove Custom Hampers filter" });
  expect((await removeCategory.boundingBox())!.width).toBeGreaterThanOrEqual(44);
  expect((await removeCategory.boundingBox())!.height).toBeGreaterThanOrEqual(44);

  await login(page);
  await visitAndCheck(page, "/admin/products");
  const firstCard = page.getByTestId("product-card-list").locator("article").first();
  const cardActions = firstCard.locator("button");
  for (let index = 0; index < Math.min(await cardActions.count(), 3); index += 1) {
    const box = await cardActions.nth(index).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
  }
});
