import { expect, test, type Page, type Request } from "@playwright/test";

import { expectNoPageOverflow, login, waitForHydration } from "./helpers";

test.describe.configure({ timeout: 90_000 });

function trackEnquiryPosts(page: Page) {
  const posts: Request[] = [];
  page.on("request", (request) => {
    if (request.method() !== "POST") return;
    const payload = `${request.url()} ${request.postData() ?? ""}`;
    if (/enquir|submitEnquiry/i.test(payload)) posts.push(request);
  });
  return posts;
}

async function openProductEnquirySheet(page: Page) {
  await page.goto("/catalog");
  await waitForHydration(page);
  const productHref = await page
    .locator('article a[href^="/catalog/"]')
    .first()
    .getAttribute("href");
  expect(productHref).toBeTruthy();
  await page.goto(productHref!);
  await waitForHydration(page);
  await page.getByRole("button", { name: "Get a Quote" }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("button", { name: "Send enquiry" })).toBeVisible();
  return sheet;
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
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible({
    timeout: 15_000,
  });
});

test("enquiry sheet shows a clear min-length error and focuses the message field", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const posts = trackEnquiryPosts(page);
  const sheet = await openProductEnquirySheet(page);

  await sheet.getByLabel("Name").fill("Amina");
  await sheet.getByLabel("WhatsApp number").fill("9876543210");
  const message = sheet.getByLabel("What are you looking for?");
  await message.fill("abc");
  await sheet.getByRole("button", { name: "Send enquiry" }).click();

  await expect(page.getByText("Enquiry sent")).toHaveCount(0);
  expect(posts).toHaveLength(0);
  await expect(message).toHaveAttribute("aria-invalid", "true");
  const messageRing = await message.evaluate((el) => getComputedStyle(el).boxShadow);
  const budgetRing = await sheet
    .getByLabel("Approx. budget (optional)")
    .evaluate((el) => getComputedStyle(el).boxShadow);
  expect(messageRing).not.toEqual(budgetRing);
  expect(messageRing).not.toBe("none");
  await expect(
    sheet.getByText("Please tell us a little more — at least 10 characters."),
  ).toBeVisible();
  await expect(
    sheet.getByRole("alert").filter({ hasText: "Please check the highlighted field below." }),
  ).toBeVisible();
  await expect(message).toBeFocused();
  await expect(sheet.getByRole("button", { name: "Send enquiry" })).toBeVisible();
  await expectNoPageOverflow(page);
});

test("enquiry sheet highlights all required fields on empty submit", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const posts = trackEnquiryPosts(page);
  const sheet = await openProductEnquirySheet(page);

  await sheet.getByRole("button", { name: "Send enquiry" }).click();

  await expect(page.getByText("Enquiry sent")).toHaveCount(0);
  expect(posts).toHaveLength(0);

  const name = sheet.getByLabel("Name");
  const phone = sheet.getByLabel("WhatsApp number");
  const message = sheet.getByLabel("What are you looking for?");
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(phone).toHaveAttribute("aria-invalid", "true");
  await expect(message).toHaveAttribute("aria-invalid", "true");
  await expect(sheet.getByText("Please enter your name")).toBeVisible();
  await expect(sheet.getByText("Enter a valid WhatsApp number")).toBeVisible();
  await expect(
    sheet.getByText("Please tell us a little more — at least 10 characters."),
  ).toBeVisible();
  await expect(
    sheet.getByRole("alert").filter({ hasText: "Please check the highlighted fields." }),
  ).toBeVisible();
  await expect(name).toBeFocused();
  await expect(sheet.locator("#website, [id$='-website']")).not.toBeFocused();
});

test("enquiry sheet accepts a valid enquiry after fixing errors", async ({ page }) => {
  const sheet = await openProductEnquirySheet(page);
  await sheet.getByRole("button", { name: "Send enquiry" }).click();
  await expect(sheet.getByLabel("Name")).toBeFocused();

  const suffix = Date.now();
  await sheet.getByLabel("Name").fill(`Sheet Lead ${suffix}`);
  await sheet.getByLabel("WhatsApp number").fill(`98${String(suffix).slice(-8)}`);
  await sheet.getByLabel("Email (optional)").fill("not-an-email");
  await sheet.getByRole("button", { name: "Send enquiry" }).click();
  await expect(sheet.getByText("Enter a valid email")).toBeVisible();
  await expect(sheet.getByLabel("Email (optional)")).toHaveAttribute("aria-invalid", "true");

  await sheet.getByLabel("Email (optional)").fill("");
  await expect(sheet.getByLabel("Event type (optional)")).toBeVisible();
  await expect(sheet.getByLabel("Event date (optional)")).toBeVisible();
  await expect(sheet.getByLabel("Approx. budget (optional)")).toBeVisible();
  await sheet
    .getByLabel("What are you looking for?")
    .fill("Need a wedding hamper quote from the product sheet.");

  await expect(sheet.getByLabel("Name")).not.toHaveAttribute("aria-invalid", "true");
  await expect(sheet.getByLabel("WhatsApp number")).not.toHaveAttribute("aria-invalid", "true");
  await expect(sheet.getByLabel("Email (optional)")).not.toHaveAttribute("aria-invalid", "true");
  await expect(sheet.getByLabel("What are you looking for?")).not.toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(sheet.getByRole("alert")).toHaveCount(0);
  await expect(sheet.getByRole("button", { name: "Send enquiry" })).toBeEnabled();
});

test("enquiry sheet leaves optional fields optional", async ({ page }) => {
  const sheet = await openProductEnquirySheet(page);

  await expect(sheet.locator("label", { hasText: "Name" }).getByText("*")).toBeVisible();
  await expect(sheet.locator("label", { hasText: "WhatsApp number" }).getByText("*")).toBeVisible();
  await expect(
    sheet.locator("label", { hasText: "What are you looking for?" }).getByText("*"),
  ).toBeVisible();
  await expect(sheet.getByLabel("Email (optional)")).toBeVisible();
  await expect(sheet.getByLabel("Event type (optional)")).toBeVisible();
  await expect(sheet.getByLabel("Event date (optional)")).toBeVisible();
  await expect(sheet.getByLabel("Approx. budget (optional)")).toBeVisible();

  await sheet.getByRole("button", { name: "Send enquiry" }).click();
  await expect(sheet.getByLabel("Email (optional)")).not.toHaveAttribute("aria-invalid", "true");
  await expect(sheet.getByLabel("Event date (optional)")).not.toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(sheet.getByText("Enter a valid email")).toHaveCount(0);
});
