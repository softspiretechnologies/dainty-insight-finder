import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { login, visit } from "./helpers";

test.describe.configure({ timeout: 120_000 });

function formatViolations(violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"]) {
  return violations
    .map(
      (violation) =>
        `${violation.impact}: ${violation.id} — ${violation.help}\n${violation.nodes
          .map((node) => `  ${node.target.join(" ")} — ${node.failureSummary ?? ""}`)
          .join("\n")}`,
    )
    .join("\n\n");
}

async function expectNoSeriousAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const blocking = results.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  );
  expect(
    blocking.map((violation) => violation.id),
    formatViolations(blocking),
  ).toEqual([]);
}

const publicRoutes = ["/", "/catalog", "/services", "/custom", "/contact", "/blog"];

for (const route of publicRoutes) {
  test(`public ${route} has no serious axe violations`, async ({ page }) => {
    await visit(page, route);
    await expectNoSeriousAccessibilityViolations(page);
  });
}

test("public product and blog details have no serious axe violations", async ({ page }) => {
  await visit(page, "/catalog");
  const productHref = await page
    .locator('article a[href^="/catalog/"]')
    .first()
    .getAttribute("href");
  expect(productHref).toBeTruthy();
  await visit(page, productHref!);
  await expectNoSeriousAccessibilityViolations(page);

  await visit(page, "/blog");
  const postHref = await page.locator('article a[href^="/blog/"]').first().getAttribute("href");
  expect(postHref).toBeTruthy();
  await visit(page, postHref!);
  await expectNoSeriousAccessibilityViolations(page);
});

test("admin login has no serious axe violations", async ({ page }) => {
  await visit(page, "/admin/login");
  await expectNoSeriousAccessibilityViolations(page);
});

test("representative authenticated admin routes have no serious axe violations", async ({
  page,
}) => {
  await login(page);
  for (const route of ["/admin", "/admin/products", "/admin/products/new", "/admin/settings"]) {
    await visit(page, route);
    await expectNoSeriousAccessibilityViolations(page);
  }
});
