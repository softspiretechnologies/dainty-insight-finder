import { describe, expect, it } from "vitest";

import { parseServerConfig } from "./config.server";

describe("parseServerConfig", () => {
  it("keeps development fallbacks optional", () => {
    expect(parseServerConfig({ NODE_ENV: "development" })).toMatchObject({
      nodeEnv: "development",
    });
  });

  it("requires strong production configuration", () => {
    expect(() =>
      parseServerConfig({ NODE_ENV: "production", ADMIN_SESSION_SECRET: "short" }),
    ).toThrow("Invalid server configuration");
  });

  it("accepts complete production configuration", () => {
    expect(
      parseServerConfig({
        NODE_ENV: "production",
        DATABASE_URL: "mysql://user:pass@localhost/db",
        ADMIN_SESSION_SECRET: "a".repeat(32),
        VITE_SITE_URL: "https://example.com",
      }),
    ).toMatchObject({ nodeEnv: "production", siteUrl: "https://example.com" });
  });
});
