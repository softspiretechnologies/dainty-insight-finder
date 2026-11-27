import { afterEach, describe, expect, it, vi } from "vitest";

import server from "./server";

afterEach(() => vi.unstubAllEnvs());

describe("server canonical host redirect", () => {
  it("returns a permanent redirect before loading SSR", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "mysql://test:test@localhost/test");
    vi.stubEnv("ADMIN_SESSION_SECRET", "test-secret-not-used-for-production-123");
    vi.stubEnv("VITE_SITE_URL", "https://daintyhand.in");

    const response = await server.fetch(
      new Request("https://www.daintyhand.in/catalog?category=hampers"),
      undefined,
      undefined,
    );
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://daintyhand.in/catalog?category=hampers");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });
});
