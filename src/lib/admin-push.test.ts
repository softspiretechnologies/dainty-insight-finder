import { createECDH } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  deriveVapidPublicKeyBase64UrlFromPrivate,
  fingerprintVapidKeyString,
  getAdminPushStatusPayload,
  getWebPushVapidConfig,
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

describe("deriveVapidPublicKeyBase64UrlFromPrivate", () => {
  it("derives the same public key as web-push.generateVAPIDKeys", () => {
    const keys = webpush.generateVAPIDKeys();
    expect(deriveVapidPublicKeyBase64UrlFromPrivate(keys.privateKey)).toBe(keys.publicKey);
  });

  it("derives correctly for 10 generated pairs", () => {
    for (let i = 0; i < 10; i += 1) {
      const keys = webpush.generateVAPIDKeys();
      expect(deriveVapidPublicKeyBase64UrlFromPrivate(keys.privateKey)).toBe(keys.publicKey);
      expect(validateVapidKeyPair(keys.publicKey, keys.privateKey)).toEqual({ ok: true });
    }
  });

  it("rejects malformed private keys gracefully", () => {
    expect(deriveVapidPublicKeyBase64UrlFromPrivate("not-a-key")).toBeNull();
    expect(deriveVapidPublicKeyBase64UrlFromPrivate("")).toBeNull();
    expect(deriveVapidPublicKeyBase64UrlFromPrivate("====")).toBeNull();
  });
});

describe("getWebPushVapidConfig (derive-only)", () => {
  it("configures successfully with only private key + subject", () => {
    const keys = webpush.generateVAPIDKeys();
    const config = getWebPushVapidConfig({
      WEB_PUSH_VAPID_PRIVATE_KEY: keys.privateKey,
      WEB_PUSH_VAPID_SUBJECT: "mailto:admin@daintyhand.in",
    });
    expect(config).toEqual({
      publicKey: keys.publicKey,
      privateKey: keys.privateKey,
      subject: "mailto:admin@daintyhand.in",
    });
  });

  it("ignores legacy public env and still uses derived public", () => {
    const keys = webpush.generateVAPIDKeys();
    const other = webpush.generateVAPIDKeys();
    const config = getWebPushVapidConfig({
      WEB_PUSH_VAPID_PRIVATE_KEY: keys.privateKey,
      WEB_PUSH_VAPID_PUBLIC_KEY: other.publicKey,
      WEB_PUSH_VAPID_SUBJECT: "mailto:admin@daintyhand.in",
    });
    expect(config?.publicKey).toBe(keys.publicKey);
    expect(config?.publicKey).not.toBe(other.publicKey);
  });

  it("returns null when private key is malformed", () => {
    expect(
      getWebPushVapidConfig({
        WEB_PUSH_VAPID_PRIVATE_KEY: "bad",
        WEB_PUSH_VAPID_SUBJECT: "mailto:admin@daintyhand.in",
      }),
    ).toBeNull();
  });
});

describe("buildVapidEnvDiagnostics", () => {
  it("reports derived fingerprints without requiring public env", () => {
    const keys = webpush.generateVAPIDKeys();
    const diagnostics = buildVapidEnvDiagnostics({
      WEB_PUSH_VAPID_PRIVATE_KEY: keys.privateKey,
      WEB_PUSH_VAPID_SUBJECT: "mailto:admin@daintyhand.in",
    });
    expect(diagnostics.derivedPublicFingerprint).toBe(fingerprintVapidKeyString(keys.publicKey));
    expect(diagnostics.derivedPublicLength).toBe(keys.publicKey.length);
    expect(diagnostics.privateLength).toBe(keys.privateKey.length);
    expect(diagnostics.privateKeyValid).toBe(true);
    expect(diagnostics.subjectValid).toBe(true);
    expect(diagnostics.legacyPublicFingerprint).toBeNull();
    expect(diagnostics.legacyPublicMatchesDerived).toBeNull();
  });

  it("reports legacy public match when legacy env matches derived", () => {
    const keys = webpush.generateVAPIDKeys();
    const diagnostics = buildVapidEnvDiagnostics({
      WEB_PUSH_VAPID_PUBLIC_KEY: keys.publicKey,
      WEB_PUSH_VAPID_PRIVATE_KEY: keys.privateKey,
      WEB_PUSH_VAPID_SUBJECT: "mailto:admin@daintyhand.in",
    });
    expect(diagnostics.legacyPublicMatchesDerived).toBe(true);
    expect(diagnostics.legacyPublicFingerprint).toBe(fingerprintVapidKeyString(keys.publicKey));
  });

  it("reports legacy mismatch without blocking derived runtime key", () => {
    const a = webpush.generateVAPIDKeys();
    const b = webpush.generateVAPIDKeys();
    const diagnostics = buildVapidEnvDiagnostics({
      WEB_PUSH_VAPID_PUBLIC_KEY: a.publicKey,
      WEB_PUSH_VAPID_PRIVATE_KEY: b.privateKey,
      WEB_PUSH_VAPID_SUBJECT: "mailto:admin@daintyhand.in",
    });
    expect(diagnostics.legacyPublicMatchesDerived).toBe(false);
    expect(diagnostics.derivedPublicFingerprint).toBe(fingerprintVapidKeyString(b.publicKey));
    expect(diagnostics.privateKeyValid).toBe(true);

    const config = getWebPushVapidConfig({
      WEB_PUSH_VAPID_PUBLIC_KEY: a.publicKey,
      WEB_PUSH_VAPID_PRIVATE_KEY: b.privateKey,
      WEB_PUSH_VAPID_SUBJECT: "mailto:admin@daintyhand.in",
    });
    expect(config?.publicKey).toBe(b.publicKey);
  });
});

describe("getAdminPushStatusPayload", () => {
  const previous = {
    public: process.env.WEB_PUSH_VAPID_PUBLIC_KEY,
    private: process.env.WEB_PUSH_VAPID_PRIVATE_KEY,
    subject: process.env.WEB_PUSH_VAPID_SUBJECT,
  };

  afterEach(() => {
    if (previous.public === undefined) delete process.env.WEB_PUSH_VAPID_PUBLIC_KEY;
    else process.env.WEB_PUSH_VAPID_PUBLIC_KEY = previous.public;
    if (previous.private === undefined) delete process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
    else process.env.WEB_PUSH_VAPID_PRIVATE_KEY = previous.private;
    if (previous.subject === undefined) delete process.env.WEB_PUSH_VAPID_SUBJECT;
    else process.env.WEB_PUSH_VAPID_SUBJECT = previous.subject;
  });

  it("returns derived public key to the browser even when legacy public mismatches", () => {
    const a = webpush.generateVAPIDKeys();
    const b = webpush.generateVAPIDKeys();
    process.env.WEB_PUSH_VAPID_PUBLIC_KEY = a.publicKey;
    process.env.WEB_PUSH_VAPID_PRIVATE_KEY = b.privateKey;
    process.env.WEB_PUSH_VAPID_SUBJECT = "mailto:admin@daintyhand.in";

    const status = getAdminPushStatusPayload();
    expect(status.configured).toBe(true);
    if (!status.configured) return;
    expect(status.vapidPublicKey).toBe(b.publicKey);
    expect(status.vapidPairValid).toBe(true);
    expect(status.vapidDiagnostics.legacyPublicMatchesDerived).toBe(false);
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

describe("admin-push-sw test renotify", () => {
  it("sets renotify only for tagged test notifications", () => {
    const source = readFileSync(join(process.cwd(), "public/admin-push-sw.js"), "utf8");
    expect(source).toContain('parsed?.type === "test" && tag ? { renotify: true } : {}');
    // Must not globally force renotify on every notification.
    expect(source).not.toMatch(/showNotification\([^)]*renotify:\s*true/);
    expect(source.match(/renotify:\s*true/g)?.length).toBe(1);
  });
});
