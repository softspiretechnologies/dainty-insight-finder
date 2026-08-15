import { describe, expect, it, vi } from "vitest";

import {
  adminPushSubscriptionInputSchema,
  detectAdminPushBrowserSupport,
  sanitizeAdminNotificationUrl,
  syncAdminAppBadge,
  vapidPublicKeyToUint8Array,
} from "@/lib/admin-push";
import { hashPushEndpoint, isStalePushSubscriptionError } from "@/lib/admin-push.server";

describe("sanitizeAdminNotificationUrl", () => {
  it("allows Admin paths", () => {
    expect(sanitizeAdminNotificationUrl("/admin")).toBe("/admin");
    expect(sanitizeAdminNotificationUrl("/admin/enquiries/123")).toBe("/admin/enquiries/123");
  });

  it("rejects unsafe destinations", () => {
    expect(sanitizeAdminNotificationUrl("https://evil.example")).toBeNull();
    expect(sanitizeAdminNotificationUrl("//evil.example")).toBeNull();
    expect(sanitizeAdminNotificationUrl("javascript:alert(1)")).toBeNull();
    expect(sanitizeAdminNotificationUrl("/public")).toBeNull();
    expect(sanitizeAdminNotificationUrl("/admin/../evil")).toBeNull();
  });
});

describe("vapidPublicKeyToUint8Array", () => {
  it("decodes URL-safe base64", () => {
    const bytes = vapidPublicKeyToUint8Array("aGk");
    expect(Array.from(bytes)).toEqual([104, 105]);
  });
});

describe("detectAdminPushBrowserSupport", () => {
  it("asks iPhone Safari users to install Home Screen Admin", () => {
    expect(
      detectAdminPushBrowserSupport({
        hasServiceWorker: true,
        hasPushManager: true,
        hasNotification: true,
        isStandalone: false,
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      }),
    ).toBe("needs_install");
  });

  it("reports unsupported when PushManager is missing", () => {
    expect(
      detectAdminPushBrowserSupport({
        hasServiceWorker: true,
        hasPushManager: false,
        hasNotification: true,
        isStandalone: true,
        userAgent: "Mozilla/5.0 (Macintosh)",
      }),
    ).toBe("unsupported");
  });

  it("reports available for standalone capable browsers", () => {
    expect(
      detectAdminPushBrowserSupport({
        hasServiceWorker: true,
        hasPushManager: true,
        hasNotification: true,
        isStandalone: true,
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      }),
    ).toBe("available");
  });
});

describe("adminPushSubscriptionInputSchema", () => {
  it("accepts a valid HTTPS subscription", () => {
    const result = adminPushSubscriptionInputSchema.safeParse({
      endpoint: "https://fcm.googleapis.com/fcm/send/abc",
      keys: { p256dh: "abc", auth: "xyz" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects http endpoints and empty keys", () => {
    expect(
      adminPushSubscriptionInputSchema.safeParse({
        endpoint: "http://example.com/push",
        keys: { p256dh: "abc", auth: "xyz" },
      }).success,
    ).toBe(false);
    expect(
      adminPushSubscriptionInputSchema.safeParse({
        endpoint: "https://example.com/push",
        keys: { p256dh: "", auth: "xyz" },
      }).success,
    ).toBe(false);
  });
});

describe("hashPushEndpoint", () => {
  it("is deterministic SHA-256 hex", () => {
    expect(hashPushEndpoint("https://example.com/a")).toBe(
      hashPushEndpoint("https://example.com/a"),
    );
    expect(hashPushEndpoint("https://example.com/a")).not.toBe(
      hashPushEndpoint("https://example.com/b"),
    );
    expect(hashPushEndpoint("https://example.com/a")).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("isStalePushSubscriptionError", () => {
  it("treats 404/410 as stale and keeps transient errors", () => {
    expect(isStalePushSubscriptionError({ statusCode: 404 })).toBe(true);
    expect(isStalePushSubscriptionError({ statusCode: 410 })).toBe(true);
    expect(isStalePushSubscriptionError({ statusCode: 429 })).toBe(false);
    expect(isStalePushSubscriptionError({ statusCode: 500 })).toBe(false);
    expect(isStalePushSubscriptionError(new Error("network"))).toBe(false);
  });
});

describe("syncAdminAppBadge", () => {
  it("sets badge for positive counts and clears for zero", async () => {
    const setAppBadge = vi.fn(async () => undefined);
    const clearAppBadge = vi.fn(async () => undefined);
    await syncAdminAppBadge(3, { setAppBadge, clearAppBadge });
    expect(setAppBadge).toHaveBeenCalledWith(3);
    await syncAdminAppBadge(0, { setAppBadge, clearAppBadge });
    expect(clearAppBadge).toHaveBeenCalled();
  });

  it("does not throw when Badging API is missing", async () => {
    await expect(syncAdminAppBadge(2, {})).resolves.toBeUndefined();
  });
});
