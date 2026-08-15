import { createECDH } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import webpush from "web-push";

import {
  adminPushSubscriptionInputSchema,
  classifyPushDeliveryFailure,
  detectAdminPushBrowserSupport,
  extractPushDeliveryDiagnostic,
  friendlyTestPushErrorMessage,
  inferPushProviderFromEndpoint,
  sanitizeAdminNotificationUrl,
  subscriptionMatchesVapidPublicKey,
  vapidPublicKeyToUint8Array,
} from "@/lib/admin-push";
import {
  buildVapidEnvDiagnostics,
  fingerprintVapidKeyString,
  hashPushEndpoint,
  isStalePushSubscriptionError,
  validateVapidKeyPair,
} from "@/lib/admin-push.server";

function sampleVapidPair() {
  const curve = createECDH("prime256v1");
  curve.generateKeys();
  let publicKeyBuffer = curve.getPublicKey();
  let privateKeyBuffer = curve.getPrivateKey();
  if (privateKeyBuffer.length < 32) {
    privateKeyBuffer = Buffer.concat([
      Buffer.alloc(32 - privateKeyBuffer.length),
      privateKeyBuffer,
    ]);
  }
  if (publicKeyBuffer.length < 65) {
    publicKeyBuffer = Buffer.concat([Buffer.alloc(65 - publicKeyBuffer.length), publicKeyBuffer]);
  }
  return {
    publicKey: publicKeyBuffer.toString("base64url"),
    privateKey: privateKeyBuffer.toString("base64url"),
  };
}

describe("sanitizeAdminNotificationUrl", () => {
  it("allows Admin paths and rejects unsafe destinations", () => {
    expect(sanitizeAdminNotificationUrl("/admin/enquiries/123")).toBe("/admin/enquiries/123");
    expect(sanitizeAdminNotificationUrl("https://evil.example")).toBeNull();
    expect(sanitizeAdminNotificationUrl("//evil.example")).toBeNull();
    expect(sanitizeAdminNotificationUrl("javascript:alert(1)")).toBeNull();
  });
});

describe("validateVapidKeyPair", () => {
  it("accepts a matching generated pair", () => {
    const keys = sampleVapidPair();
    expect(validateVapidKeyPair(keys.publicKey, keys.privateKey)).toEqual({ ok: true });
  });

  it("rejects mismatched public/private keys", () => {
    const a = sampleVapidPair();
    const b = sampleVapidPair();
    expect(validateVapidKeyPair(a.publicKey, b.privateKey).ok).toBe(false);
  });

  it("accepts every pair from web-push.generateVAPIDKeys (10 samples)", () => {
    for (let i = 0; i < 10; i += 1) {
      const keys = webpush.generateVAPIDKeys();
      expect(validateVapidKeyPair(keys.publicKey, keys.privateKey)).toEqual({ ok: true });
    }
  });

  it("rejects intentionally crossed web-push pairs", () => {
    const a = webpush.generateVAPIDKeys();
    const b = webpush.generateVAPIDKeys();
    expect(validateVapidKeyPair(a.publicKey, b.privateKey).ok).toBe(false);
    expect(validateVapidKeyPair(b.publicKey, a.privateKey).ok).toBe(false);
  });
});

describe("buildVapidEnvDiagnostics", () => {
  it("returns safe fingerprints that match for a valid pair", () => {
    const keys = webpush.generateVAPIDKeys();
    const diagnostics = buildVapidEnvDiagnostics({
      WEB_PUSH_VAPID_PUBLIC_KEY: keys.publicKey,
      WEB_PUSH_VAPID_PRIVATE_KEY: keys.privateKey,
      WEB_PUSH_VAPID_SUBJECT: "mailto:admin@daintyhand.in",
    });
    expect(diagnostics.publicFingerprint).toBe(fingerprintVapidKeyString(keys.publicKey));
    expect(diagnostics.derivedFingerprint).toBe(diagnostics.publicFingerprint);
    expect(diagnostics.publicLength).toBe(keys.publicKey.length);
    expect(diagnostics.privateLength).toBe(keys.privateKey.length);
    expect(diagnostics.pairMatches).toBe(true);
    expect(diagnostics.subjectValid).toBe(true);
    expect(diagnostics.publicFingerprint).toMatch(/^[0-9a-f]{12}$/);
  });

  it("shows diverging fingerprints for crossed pairs", () => {
    const a = webpush.generateVAPIDKeys();
    const b = webpush.generateVAPIDKeys();
    const diagnostics = buildVapidEnvDiagnostics({
      WEB_PUSH_VAPID_PUBLIC_KEY: a.publicKey,
      WEB_PUSH_VAPID_PRIVATE_KEY: b.privateKey,
      WEB_PUSH_VAPID_SUBJECT: "mailto:admin@daintyhand.in",
    });
    expect(diagnostics.pairMatches).toBe(false);
    expect(diagnostics.publicFingerprint).not.toBe(diagnostics.derivedFingerprint);
  });
});

describe("subscriptionMatchesVapidPublicKey", () => {
  it("detects matching and mismatched applicationServerKey bytes", () => {
    const keys = sampleVapidPair();
    const expected = vapidPublicKeyToUint8Array(keys.publicKey);
    expect(subscriptionMatchesVapidPublicKey(expected, keys.publicKey)).toBe(true);
    const other = sampleVapidPair();
    expect(subscriptionMatchesVapidPublicKey(expected, other.publicKey)).toBe(false);
    expect(subscriptionMatchesVapidPublicKey(null, keys.publicKey)).toBeNull();
  });
});

describe("classifyPushDeliveryFailure", () => {
  it("classifies status codes and network codes", () => {
    expect(classifyPushDeliveryFailure({ statusCode: 401 })).toBe("vapid_auth");
    expect(classifyPushDeliveryFailure({ statusCode: 403 })).toBe("vapid_auth");
    expect(classifyPushDeliveryFailure({ statusCode: 404 })).toBe("stale_subscription");
    expect(classifyPushDeliveryFailure({ statusCode: 410 })).toBe("stale_subscription");
    expect(classifyPushDeliveryFailure({ statusCode: 429 })).toBe("rate_limited");
    expect(classifyPushDeliveryFailure({ statusCode: 500 })).toBe("provider_temporary");
    expect(classifyPushDeliveryFailure({ statusCode: 503 })).toBe("provider_temporary");
    expect(classifyPushDeliveryFailure({ code: "ETIMEDOUT" })).toBe("network");
    expect(classifyPushDeliveryFailure({ code: "ENOTFOUND" })).toBe("network");
    expect(classifyPushDeliveryFailure({ statusCode: 418 })).toBe("unknown");
  });
});

describe("extractPushDeliveryDiagnostic", () => {
  it("extracts safe fields and never requires endpoint logging", () => {
    const diagnostic = extractPushDeliveryDiagnostic(
      { statusCode: 403, body: "BadJwtToken", name: "WebPushError" },
      { endpointForProviderInference: "https://web.push.apple.com/example" },
    );
    expect(diagnostic).toMatchObject({
      category: "vapid_auth",
      statusCode: 403,
      reason: "BadJwtToken",
      provider: "apple",
    });
    expect(friendlyTestPushErrorMessage(diagnostic)).toMatch(/VAPID key pair/i);
  });
});

describe("inferPushProviderFromEndpoint", () => {
  it("maps known push hosts", () => {
    expect(inferPushProviderFromEndpoint("https://web.push.apple.com/x")).toBe("apple");
    expect(inferPushProviderFromEndpoint("https://fcm.googleapis.com/fcm/send/x")).toBe("fcm");
  });
});

describe("adminPushSubscriptionInputSchema", () => {
  it("accepts realistic Chromium and Apple-shaped subscriptions", () => {
    const chrome = adminPushSubscriptionInputSchema.safeParse({
      endpoint: "https://fcm.googleapis.com/fcm/send/abc123",
      keys: {
        p256dh: "BNcRdreALSVUFz-b0_7h_RIi1CvmFEfYwqN9yqWqQkqXzqYqYqYqYqYqYqYqYqYqYqY",
        auth: "tBHItJI5svbpez7KI4CCXg",
      },
    });
    expect(chrome.success).toBe(true);

    const apple = adminPushSubscriptionInputSchema.safeParse({
      endpoint:
        "https://web.push.apple.com/QPr1Y9sGNqXabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
      keys: {
        p256dh: "BNcRdreALSVUFz-b0_7h_RIi1CvmFEfYwqN9yqWqQkqXzqYqYqYqYqYqYqYqYqYqYqY",
        auth: "tBHItJI5svbpez7KI4CCXg",
      },
    });
    expect(apple.success).toBe(true);
  });
});

describe("hashPushEndpoint / stale helper", () => {
  it("hashes deterministically and detects stale statuses", () => {
    expect(hashPushEndpoint("https://example.com/a")).toMatch(/^[a-f0-9]{64}$/);
    expect(isStalePushSubscriptionError({ statusCode: 410 })).toBe(true);
    expect(isStalePushSubscriptionError({ statusCode: 403 })).toBe(false);
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
});

describe("syncAdminAppBadge", () => {
  it("sets and clears badges safely", async () => {
    const { syncAdminAppBadge } = await import("@/lib/admin-push");
    const setAppBadge = vi.fn(async () => undefined);
    const clearAppBadge = vi.fn(async () => undefined);
    await syncAdminAppBadge(3, { setAppBadge, clearAppBadge });
    expect(setAppBadge).toHaveBeenCalledWith(3);
    await syncAdminAppBadge(0, { setAppBadge, clearAppBadge });
    expect(clearAppBadge).toHaveBeenCalled();
    await expect(syncAdminAppBadge(1, {})).resolves.toBeUndefined();
  });
});

describe("resolveSubscriptionForCurrentVapidKey", () => {
  it("reuses matching subscription and resubscribes when key differs", async () => {
    const matching = sampleVapidPair();
    const other = sampleVapidPair();
    const matchingBytes = vapidPublicKeyToUint8Array(matching.publicKey);
    const otherBytes = vapidPublicKeyToUint8Array(other.publicKey);

    const unsubscribe = vi.fn(async () => true);
    const subscribe = vi.fn(async () => ({
      toJSON: () => ({
        endpoint: "https://fcm.googleapis.com/fcm/send/new",
        keys: { p256dh: "p", auth: "a" },
      }),
    }));

    let keyBytes: BufferSource = matchingBytes;
    const getSubscription = vi.fn(async () => ({
      options: { applicationServerKey: keyBytes },
      unsubscribe,
      toJSON: () => ({
        endpoint: "https://fcm.googleapis.com/fcm/send/old",
        keys: { p256dh: "p", auth: "a" },
      }),
    }));

    const { resolveSubscriptionForCurrentVapidKey } = await import("@/lib/admin-push-browser");

    const reuse = await resolveSubscriptionForCurrentVapidKey({
      vapidPublicKey: matching.publicKey,
      getSubscription,
      subscribe,
    });
    expect(reuse.ok).toBe(true);
    expect(unsubscribe).not.toHaveBeenCalled();
    expect(subscribe).not.toHaveBeenCalled();

    keyBytes = otherBytes;
    const refreshed = await resolveSubscriptionForCurrentVapidKey({
      vapidPublicKey: matching.publicKey,
      getSubscription,
      subscribe,
    });
    expect(refreshed.ok).toBe(true);
    expect(unsubscribe).toHaveBeenCalled();
    expect(subscribe).toHaveBeenCalled();
  });
});
