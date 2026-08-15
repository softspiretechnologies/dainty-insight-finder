import { beforeEach, describe, expect, it, vi } from "vitest";
import webpush from "web-push";

import { hashPushEndpoint } from "@/lib/admin-push.server";

const isDatabaseConfigured = vi.fn(() => true);
const insertValues = vi.fn();
const onDuplicateKeyUpdate = vi.fn();
const deleteWhere = vi.fn();

vi.mock("@/db/index.server", () => ({
  isDatabaseConfigured: () => isDatabaseConfigured(),
  getDb: () => ({
    insert: () => ({
      values: (...args: unknown[]) => {
        insertValues(...args);
        return {
          onDuplicateKeyUpdate: (...updateArgs: unknown[]) => {
            onDuplicateKeyUpdate(...updateArgs);
            return Promise.resolve([{ affectedRows: 1 }]);
          },
        };
      },
    }),
    delete: () => ({
      where: (...args: unknown[]) => {
        deleteWhere(...args);
        return Promise.resolve([{ affectedRows: 1 }]);
      },
    }),
  }),
}));

vi.mock("@/lib/logger.server", () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
}));

describe("admin push subscription persistence", () => {
  beforeEach(() => {
    vi.resetModules();
    const keys = webpush.generateVAPIDKeys();
    delete process.env.WEB_PUSH_VAPID_PUBLIC_KEY;
    process.env.WEB_PUSH_VAPID_PRIVATE_KEY = keys.privateKey;
    process.env.WEB_PUSH_VAPID_SUBJECT = "mailto:admin@daintyhand.in";
    insertValues.mockClear();
    onDuplicateKeyUpdate.mockClear();
    deleteWhere.mockClear();
    isDatabaseConfigured.mockReturnValue(true);
  });

  it("upserts by endpoint hash for the authenticated Admin user", async () => {
    const { saveAdminPushSubscriptionForUser } = await import("@/lib/admin-push.server");
    const endpoint = "https://fcm.googleapis.com/fcm/send/device-1";
    const result = await saveAdminPushSubscriptionForUser(3, {
      endpoint,
      keys: { p256dh: "p256", auth: "authkey" },
    });

    expect(result).toEqual({ ok: true });
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        adminUserId: 3,
        endpoint,
        endpointHash: hashPushEndpoint(endpoint),
        p256dh: "p256",
        auth: "authkey",
      }),
    );
    expect(onDuplicateKeyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        set: expect.objectContaining({ adminUserId: 3, p256dh: "p256", auth: "authkey" }),
      }),
    );
  });

  it("rejects malformed subscriptions", async () => {
    const { saveAdminPushSubscriptionForUser } = await import("@/lib/admin-push.server");
    const result = await saveAdminPushSubscriptionForUser(3, {
      endpoint: "http://insecure.example",
      keys: { p256dh: "p", auth: "a" },
    });
    expect(result.ok).toBe(false);
    expect(insertValues).not.toHaveBeenCalled();
  });

  it("scopes delete to matching endpoint hash AND admin user", async () => {
    const { removeAdminPushSubscriptionForUser } = await import("@/lib/admin-push.server");
    const endpoint = "https://fcm.googleapis.com/fcm/send/device-1";
    const result = await removeAdminPushSubscriptionForUser(9, endpoint);
    expect(result).toEqual({ ok: true });
    expect(deleteWhere).toHaveBeenCalled();
  });

  it("does not accept adminUserId from the browser payload", async () => {
    const { saveAdminPushSubscriptionForUser } = await import("@/lib/admin-push.server");
    await saveAdminPushSubscriptionForUser(3, {
      endpoint: "https://fcm.googleapis.com/fcm/send/device-2",
      keys: { p256dh: "p256", auth: "authkey" },
      adminUserId: 999,
    });
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        adminUserId: 3,
      }),
    );
    expect(insertValues.mock.calls[0]?.[0]).not.toHaveProperty("adminUserId", 999);
  });
});
