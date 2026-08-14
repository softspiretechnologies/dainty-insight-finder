import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL || "http://127.0.0.1:4173";
const databaseUrl = process.env.DATABASE_URL;

if (process.env.E2E_BASE_URL && !/^https?:\/\/(127\.0\.0\.1|localhost)(?::|\/|$)/.test(baseURL)) {
  throw new Error(
    "Remote E2E targets are disabled. Run the suite against an isolated local server.",
  );
}

if (!process.env.E2E_BASE_URL) {
  const databaseName = databaseUrl ? new URL(databaseUrl).pathname.replace(/^\//, "") : "";
  if (!/(test|e2e)/i.test(databaseName)) {
    throw new Error(
      "DATABASE_URL must name an isolated test/e2e database before running Playwright.",
    );
  }
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev -- --host 127.0.0.1 --port 4173",
        url: "http://127.0.0.1:4173/health",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
