import { beforeEach, describe, expect, it, vi } from "vitest";

import { hashPushEndpoint, isStalePushSubscriptionError } from "@/lib/admin-push.server";

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

describe("sendAdminNotification", () => {
  beforeEach(() => {
    vi.resetModules();
    deletedHashes.length = 0;
    process.env.WEB_PUSH_VAPID_PUBLIC_KEY = "pub";
    process.env.WEB_PUSH_VAPID_PRIVATE_KEY = "priv";
    process.env.WEB_PUSH_VAPID_SUBJECT = "mailto:admin@daintyhand.in";
    getDb.mockReset();
  });

  it("sends to every subscription; keeps 429/500; deletes 410", async () => {
    const rows = [
      {
        id: 1,
        adminUserId: 1,
        endpoint: "https://push.example/ok",
        endpointHash: hashPushEndpoint("https://push.example/ok"),
        p256dh: "k1",
        auth: "a1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        adminUserId: 1,
        endpoint: "https://push.example/gone",
        endpointHash: hashPushEndpoint("https://push.example/gone"),
        p256dh: "k2",
        auth: "a2",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        adminUserId: 1,
        endpoint: "https://push.example/busy",
        endpointHash: hashPushEndpoint("https://push.example/busy"),
        p256dh: "k3",
        auth: "a3",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    getDb.mockReturnValue({
      select: () => ({
        from: () => Promise.resolve(rows),
      }),
      delete: () => ({
        where: async () => {
          deletedHashes.push("stale");
          return [{ affectedRows: 1 }];
        },
      }),
    });

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
            if (subscription.endpoint.endsWith("/gone")) {
              throw Object.assign(new Error("gone"), { statusCode: 410 });
            }
            if (subscription.endpoint.endsWith("/busy")) {
              throw Object.assign(new Error("busy"), { statusCode: 429 });
            }
            return {};
          },
        },
      },
    );

    expect(attempted).toHaveLength(3);
    expect(result.successCount).toBe(1);
    expect(result.staleCount).toBe(1);
    expect(result.failureCount).toBe(2);
    expect(deletedHashes.length).toBeGreaterThanOrEqual(1);
    expect(isStalePushSubscriptionError({ statusCode: 500 })).toBe(false);
  });
});
