import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import webpush from "web-push";

import { hashPushEndpoint, validateVapidKeyPair } from "@/lib/admin-push.server";

const getDb = vi.fn();
const deletedHashes: string[] = [];

vi.mock("@/db/index.server", () => ({
  isDatabaseConfigured: () => true,
  getDb: (...args: unknown[]) => getDb(...args),
}));

vi.mock("@/lib/logger.server", () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
}));

describe("sendAdminNotification transport matrix", () => {
  const previous = {
    public: process.env.WEB_PUSH_VAPID_PUBLIC_KEY,
    private: process.env.WEB_PUSH_VAPID_PRIVATE_KEY,
    subject: process.env.WEB_PUSH_VAPID_SUBJECT,
  };
  let testKeys: { publicKey: string; privateKey: string };

  beforeEach(() => {
    vi.resetModules();
    deletedHashes.length = 0;
    testKeys = webpush.generateVAPIDKeys();
    delete process.env.WEB_PUSH_VAPID_PUBLIC_KEY;
    process.env.WEB_PUSH_VAPID_PRIVATE_KEY = testKeys.privateKey;
    process.env.WEB_PUSH_VAPID_SUBJECT = "mailto:admin@daintyhand.in";
    getDb.mockReset();
  });

  afterEach(() => {
    if (previous.public === undefined) delete process.env.WEB_PUSH_VAPID_PUBLIC_KEY;
    else process.env.WEB_PUSH_VAPID_PUBLIC_KEY = previous.public;
    if (previous.private === undefined) delete process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
    else process.env.WEB_PUSH_VAPID_PRIVATE_KEY = previous.private;
    if (previous.subject === undefined) delete process.env.WEB_PUSH_VAPID_SUBJECT;
    else process.env.WEB_PUSH_VAPID_SUBJECT = previous.subject;
  });

  function mockRows(
    rows: Array<{ endpoint: string; p256dh?: string; auth?: string; adminUserId?: number }>,
  ) {
    const mapped = rows.map((row, index) => ({
      id: index + 1,
      adminUserId: row.adminUserId ?? 1,
      endpoint: row.endpoint,
      endpointHash: hashPushEndpoint(row.endpoint),
      p256dh: row.p256dh ?? "k",
      auth: row.auth ?? "a",
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    getDb.mockReturnValue({
      select: () => ({
        from: () => Promise.resolve(mapped),
      }),
      delete: () => ({
        where: async () => {
          deletedHashes.push("stale");
          return [{ affectedRows: 1 }];
        },
      }),
    });
    return mapped;
  }

  it("records success and classifies failures without stopping other devices", async () => {
    mockRows([
      { endpoint: "https://push.example/ok" },
      { endpoint: "https://push.example/forbidden" },
      { endpoint: "https://push.example/gone" },
      { endpoint: "https://push.example/busy" },
      { endpoint: "https://push.example/down" },
      { endpoint: "https://push.example/timeout" },
      { endpoint: "https://push.example/dns" },
      { endpoint: "https://push.example/weird" },
    ]);

    const { sendAdminNotification } = await import("@/lib/admin-push.server");
    const attempted: string[] = [];

    const result = await sendAdminNotification(
      {
        type: "test",
        title: "DaintyHand Admin",
        body: "Notifications are working.",
        url: "/admin",
      },
      {
        transport: {
          sendNotification: async (subscription) => {
            attempted.push(subscription.endpoint);
            if (subscription.endpoint.endsWith("/ok")) return {};
            if (subscription.endpoint.endsWith("/forbidden")) {
              throw Object.assign(new Error("forbidden"), {
                statusCode: 403,
                body: "BadJwtToken",
              });
            }
            if (subscription.endpoint.endsWith("/gone")) {
              throw Object.assign(new Error("gone"), { statusCode: 410 });
            }
            if (subscription.endpoint.endsWith("/busy")) {
              throw Object.assign(new Error("busy"), { statusCode: 429 });
            }
            if (subscription.endpoint.endsWith("/down")) {
              throw Object.assign(new Error("down"), { statusCode: 503 });
            }
            if (subscription.endpoint.endsWith("/timeout")) {
              throw Object.assign(new Error("timeout"), { code: "ETIMEDOUT" });
            }
            if (subscription.endpoint.endsWith("/dns")) {
              throw Object.assign(new Error("dns"), { code: "ENOTFOUND" });
            }
            throw new Error("mystery");
          },
        },
      },
    );

    expect(attempted).toHaveLength(8);
    expect(result.successCount).toBe(1);
    expect(result.staleCount).toBe(1);
    expect(result.failureCount).toBe(7);
    expect(deletedHashes.length).toBeGreaterThanOrEqual(1);

    const categories = result.failures.map((f) => f.category).sort();
    expect(categories).toEqual(
      [
        "vapid_auth",
        "stale_subscription",
        "rate_limited",
        "provider_temporary",
        "network",
        "network",
        "unknown",
      ].sort(),
    );

    const forbidden = result.failures.find((f) => f.statusCode === 403);
    expect(forbidden?.reason).toBe("BadJwtToken");
  });

  it("passes matching derived vapidDetails to sendNotification", async () => {
    mockRows([{ endpoint: "https://push.example/ok" }]);
    const { sendAdminNotification } = await import("@/lib/admin-push.server");

    let captured: { subject: string; publicKey: string; privateKey: string } | undefined;
    await sendAdminNotification(
      { type: "test", title: "t", body: "b", url: "/admin" },
      {
        transport: {
          sendNotification: async (_subscription, _payload, options) => {
            captured = options?.vapidDetails;
            return {};
          },
        },
      },
    );

    expect(captured).toEqual({
      subject: "mailto:admin@daintyhand.in",
      publicKey: testKeys.publicKey,
      privateKey: testKeys.privateKey,
    });
    expect(validateVapidKeyPair(captured!.publicKey, captured!.privateKey)).toEqual({ ok: true });
  });

  it("keeps 401 subscriptions and deletes only 404/410", async () => {
    mockRows([
      { endpoint: "https://push.example/unauthorized" },
      { endpoint: "https://push.example/missing" },
    ]);
    const { sendAdminNotification } = await import("@/lib/admin-push.server");
    await sendAdminNotification(
      { type: "test", title: "t", body: "b", url: "/admin" },
      {
        transport: {
          sendNotification: async (subscription) => {
            if (subscription.endpoint.endsWith("/unauthorized")) {
              throw Object.assign(new Error("unauthorized"), { statusCode: 401 });
            }
            throw Object.assign(new Error("missing"), { statusCode: 404 });
          },
        },
      },
    );
    expect(deletedHashes).toHaveLength(1);
  });
});
