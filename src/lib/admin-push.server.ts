import { createECDH, createHash } from "node:crypto";
import { and, count, eq } from "drizzle-orm";
import webpush from "web-push";

import { getDb, isDatabaseConfigured } from "@/db/index.server";
import { adminPushSubscriptions, enquiries } from "@/db/schema";
import {
  adminPushSubscriptionInputSchema,
  extractPushDeliveryDiagnostic,
  friendlyTestPushErrorMessage,
  sanitizeAdminNotificationUrl,
  type AdminNotificationPayload,
  type AdminPushSubscriptionInput,
  type PushDeliveryDiagnostic,
} from "@/lib/admin-push";
import { logError, logInfo } from "@/lib/logger.server";

const PUSH_TIMEOUT_MS = 10_000;
const GENERIC_PUSH_ERROR = "Push notifications could not be updated. Please try again.";

export type WebPushVapidConfig = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

function decodeVapidBase64Url(value: string): Buffer | null {
  try {
    const trimmed = value.trim();
    if (!trimmed || trimmed.includes("=")) return null;
    if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) return null;
    const buf = Buffer.from(trimmed, "base64url");
    return buf.length > 0 ? buf : null;
  } catch {
    return null;
  }
}

/** First 12 hex chars of SHA-256 over the raw trimmed UTF-8 string (never logs the input). */
export function fingerprintVapidKeyString(value: string): string {
  return createHash("sha256").update(value.trim(), "utf8").digest("hex").slice(0, 12);
}

/**
 * Derive uncompressed P-256 public key (base64url) from a VAPID private key string.
 * Uses the same decode + ECDH path as validateVapidKeyPair.
 */
export function deriveVapidPublicKeyBase64UrlFromPrivate(privateKey: string): string | null {
  const priv = decodeVapidBase64Url(privateKey);
  if (!priv || priv.length !== 32) return null;
  try {
    const ecdh = createECDH("prime256v1");
    ecdh.setPrivateKey(priv);
    const derived = ecdh.getPublicKey(null, "uncompressed");
    if (derived.length !== 65 || derived[0] !== 0x04) return null;
    return derived.toString("base64url");
  } catch {
    return null;
  }
}

/**
 * Confirm public/private VAPID keys are a matching P-256 pair.
 * Never logs or returns key material.
 */
export function validateVapidKeyPair(
  publicKey: string,
  privateKey: string,
): { ok: true } | { ok: false; reason: "invalid_format" | "length" | "mismatch" } {
  const pub = decodeVapidBase64Url(publicKey);
  const priv = decodeVapidBase64Url(privateKey);
  if (!pub || !priv) return { ok: false, reason: "invalid_format" };
  if (priv.length !== 32) return { ok: false, reason: "length" };
  if (pub.length !== 65 || pub[0] !== 0x04) return { ok: false, reason: "length" };

  const derivedB64 = deriveVapidPublicKeyBase64UrlFromPrivate(privateKey);
  if (!derivedB64) return { ok: false, reason: "invalid_format" };
  const derived = decodeVapidBase64Url(derivedB64);
  if (!derived || Buffer.compare(derived, pub) !== 0) {
    return { ok: false, reason: "mismatch" };
  }
  return { ok: true };
}

export type VapidEnvDiagnostics = {
  /** Fingerprint of the server-derived public key (runtime source of truth). */
  derivedPublicFingerprint: string | null;
  derivedPublicLength: number | null;
  privateLength: number | null;
  privateKeyValid: boolean;
  subjectValid: boolean;
  /** Present only when legacy WEB_PUSH_VAPID_PUBLIC_KEY is still set in the process env. */
  legacyPublicFingerprint: string | null;
  legacyPublicLength: number | null;
  legacyPublicMatchesDerived: boolean | null;
};

/**
 * Safe fingerprints of whatever VAPID env the *current Node process* actually reads.
 * Never includes key material. Runtime uses the derived public key, not the legacy env.
 */
export function buildVapidEnvDiagnostics(
  env: NodeJS.ProcessEnv = process.env,
): VapidEnvDiagnostics {
  const legacyPublic = env.WEB_PUSH_VAPID_PUBLIC_KEY?.trim() ?? "";
  const privateKey = env.WEB_PUSH_VAPID_PRIVATE_KEY?.trim() ?? "";
  const subject = env.WEB_PUSH_VAPID_SUBJECT?.trim() ?? "";

  const derivedPublic = privateKey ? deriveVapidPublicKeyBase64UrlFromPrivate(privateKey) : null;
  const derivedPublicFingerprint = derivedPublic ? fingerprintVapidKeyString(derivedPublic) : null;

  const legacyPublicFingerprint = legacyPublic ? fingerprintVapidKeyString(legacyPublic) : null;

  let legacyPublicMatchesDerived: boolean | null = null;
  if (legacyPublic && derivedPublic) {
    legacyPublicMatchesDerived = validateVapidKeyPair(legacyPublic, privateKey).ok;
  } else if (legacyPublic && !derivedPublic) {
    legacyPublicMatchesDerived = false;
  }

  return {
    derivedPublicFingerprint,
    derivedPublicLength: derivedPublic ? derivedPublic.length : null,
    privateLength: privateKey ? privateKey.length : null,
    privateKeyValid: Boolean(derivedPublic),
    subjectValid: isValidVapidSubject(subject),
    legacyPublicFingerprint,
    legacyPublicLength: legacyPublic ? legacyPublic.length : null,
    legacyPublicMatchesDerived,
  };
}

export function isValidVapidSubject(subject: string): boolean {
  return normalizeVapidSubject(subject) !== null;
}

/**
 * Normalize VAPID subject for JWT `sub` (Apple is strict).
 * Accepts MAILTO:/Mailto: and returns canonical mailto:/https: form.
 */
export function normalizeVapidSubject(subject: string): string | null {
  const trimmed = subject.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "mailto:") {
      const email = decodeURIComponent(parsed.pathname).trim();
      if (!email.includes("@")) return null;
      return `mailto:${email}`;
    }
    if (parsed.protocol === "https:") {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Optional Web Push config — missing/malformed env must never fail app boot.
 * Public key is always derived from WEB_PUSH_VAPID_PRIVATE_KEY (single source of truth).
 * Legacy WEB_PUSH_VAPID_PUBLIC_KEY is ignored for runtime.
 */
export function getWebPushVapidConfig(
  env: NodeJS.ProcessEnv = process.env,
): WebPushVapidConfig | null {
  const privateKey = env.WEB_PUSH_VAPID_PRIVATE_KEY?.trim();
  const subjectRaw = env.WEB_PUSH_VAPID_SUBJECT?.trim();
  if (!privateKey || !subjectRaw) return null;
  const subject = normalizeVapidSubject(subjectRaw);
  if (!subject) return null;
  const publicKey = deriveVapidPublicKeyBase64UrlFromPrivate(privateKey);
  if (!publicKey) return null;
  return { publicKey, privateKey, subject };
}

export function assessWebPushVapidConfig(env: NodeJS.ProcessEnv = process.env): {
  configured: boolean;
  /** Always true when configured — public is derived from private. */
  pairValid: boolean | null;
  subjectValid: boolean;
  privateKeyValid: boolean;
  publicKey?: string;
  legacyPublicMatchesDerived: boolean | null;
} {
  const privateKey = env.WEB_PUSH_VAPID_PRIVATE_KEY?.trim() ?? "";
  const subject = env.WEB_PUSH_VAPID_SUBJECT?.trim() ?? "";
  const subjectValid = isValidVapidSubject(subject);
  const diagnostics = buildVapidEnvDiagnostics(env);
  const publicKey = privateKey ? deriveVapidPublicKeyBase64UrlFromPrivate(privateKey) : null;

  if (!privateKey || !subjectValid || !publicKey) {
    return {
      configured: false,
      pairValid: null,
      subjectValid,
      privateKeyValid: Boolean(publicKey),
      legacyPublicMatchesDerived: diagnostics.legacyPublicMatchesDerived,
    };
  }

  return {
    configured: true,
    pairValid: true,
    subjectValid: true,
    privateKeyValid: true,
    publicKey,
    legacyPublicMatchesDerived: diagnostics.legacyPublicMatchesDerived,
  };
}

export function hashPushEndpoint(endpoint: string): string {
  return createHash("sha256").update(endpoint, "utf8").digest("hex");
}

export function isStalePushSubscriptionError(error: unknown): boolean {
  return extractPushDeliveryDiagnostic(error).category === "stale_subscription";
}

export type PushTransport = {
  sendNotification: (
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: string,
    options?: { TTL?: number; timeout?: number; vapidDetails?: WebPushVapidConfig },
  ) => Promise<unknown>;
};

function defaultTransport(): PushTransport {
  return {
    sendNotification: (subscription, payload, options) =>
      webpush.sendNotification(subscription, payload, options),
  };
}

export async function countNewEnquiries(): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  const rows = await getDb()
    .select({ value: count() })
    .from(enquiries)
    .where(eq(enquiries.status, "new"));
  return Number(rows[0]?.value ?? 0);
}

export function getAdminPushStatusPayload() {
  const vapidDiagnostics = buildVapidEnvDiagnostics();
  const assessment = assessWebPushVapidConfig();
  if (!assessment.configured || !assessment.publicKey) {
    return {
      configured: false as const,
      vapidPairValid: null as boolean | null,
      vapidDiagnostics,
    };
  }
  return {
    configured: true as const,
    /** Always the derived public key — never the legacy env value. */
    vapidPublicKey: assessment.publicKey,
    vapidPairValid: true as const,
    vapidDiagnostics,
  };
}

export async function saveAdminPushSubscriptionForUser(
  adminUserId: number,
  raw: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const vapid = getWebPushVapidConfig();
  if (!vapid) {
    return { ok: false, error: "Push notifications are not configured for this deployment." };
  }
  if (!isDatabaseConfigured()) {
    return { ok: false, error: GENERIC_PUSH_ERROR };
  }

  const parsed = adminPushSubscriptionInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid push subscription." };
  }

  const input: AdminPushSubscriptionInput = parsed.data;
  const endpointHash = hashPushEndpoint(input.endpoint);

  try {
    const db = getDb();
    await db
      .insert(adminPushSubscriptions)
      .values({
        adminUserId,
        endpoint: input.endpoint,
        endpointHash,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
      })
      .onDuplicateKeyUpdate({
        set: {
          adminUserId,
          endpoint: input.endpoint,
          p256dh: input.keys.p256dh,
          auth: input.keys.auth,
          updatedAt: new Date(),
        },
      });
    logInfo("admin_push.subscription_saved", { adminUserId });
    return { ok: true };
  } catch (error) {
    logError("admin_push.subscription_save_failed", error, { adminUserId });
    return { ok: false, error: GENERIC_PUSH_ERROR };
  }
}

export async function removeAdminPushSubscriptionForUser(
  adminUserId: number,
  endpoint: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isDatabaseConfigured()) {
    return { ok: false, error: GENERIC_PUSH_ERROR };
  }

  const trimmed = typeof endpoint === "string" ? endpoint.trim() : "";
  if (!trimmed || trimmed.length > 4096) {
    return { ok: false, error: "Invalid push subscription." };
  }

  try {
    const endpointHash = hashPushEndpoint(trimmed);
    const result = await getDb()
      .delete(adminPushSubscriptions)
      .where(
        and(
          eq(adminPushSubscriptions.endpointHash, endpointHash),
          eq(adminPushSubscriptions.adminUserId, adminUserId),
        ),
      );
    const header = Array.isArray(result) ? result[0] : result;
    const affected = Number((header as { affectedRows?: number })?.affectedRows ?? 0);
    logInfo("admin_push.subscription_removed", { adminUserId, removed: affected > 0 });
    return { ok: true };
  } catch (error) {
    logError("admin_push.subscription_remove_failed", error, { adminUserId });
    return { ok: false, error: GENERIC_PUSH_ERROR };
  }
}

export type SendAdminNotificationInput = {
  type: AdminNotificationPayload["type"];
  title: string;
  body: string;
  url: string;
  tag?: string;
  badgeCount?: number;
  /** When set, only send to this Admin user's subscriptions (e.g. test). */
  adminUserId?: number;
  /** When set with adminUserId, only this device endpoint. */
  endpoint?: string;
};

export type SendAdminNotificationResult = {
  subscriptionCount: number;
  successCount: number;
  failureCount: number;
  staleCount: number;
  /** SAFE per-device failure diagnostics (no endpoints/keys). */
  failures: PushDeliveryDiagnostic[];
};

/**
 * Internal trusted sender. Never throws — callers can await safely.
 * Sends concurrently; one broken device does not block others.
 */
export async function sendAdminNotification(
  input: SendAdminNotificationInput,
  options?: { transport?: PushTransport },
): Promise<SendAdminNotificationResult> {
  const empty: SendAdminNotificationResult = {
    subscriptionCount: 0,
    successCount: 0,
    failureCount: 0,
    staleCount: 0,
    failures: [],
  };

  try {
    const vapid = getWebPushVapidConfig();
    if (!vapid || !isDatabaseConfigured()) {
      return empty;
    }

    const safeUrl = sanitizeAdminNotificationUrl(input.url);
    if (!safeUrl) {
      logError("admin_push.send_failed", new Error("Unsafe notification URL"), {
        notificationType: input.type,
      });
      return empty;
    }

    const payload: AdminNotificationPayload = {
      version: 1,
      type: input.type,
      title: input.title,
      body: input.body,
      url: safeUrl,
      ...(input.tag ? { tag: input.tag } : {}),
      ...(typeof input.badgeCount === "number" ? { badgeCount: input.badgeCount } : {}),
    };

    const db = getDb();
    let rows;
    if (input.adminUserId && input.endpoint) {
      const endpointHash = hashPushEndpoint(input.endpoint);
      rows = await db
        .select()
        .from(adminPushSubscriptions)
        .where(
          and(
            eq(adminPushSubscriptions.adminUserId, input.adminUserId),
            eq(adminPushSubscriptions.endpointHash, endpointHash),
          ),
        );
    } else if (input.adminUserId) {
      rows = await db
        .select()
        .from(adminPushSubscriptions)
        .where(eq(adminPushSubscriptions.adminUserId, input.adminUserId));
    } else {
      rows = await db.select().from(adminPushSubscriptions);
    }

    const transport = options?.transport ?? defaultTransport();
    const payloadJson = JSON.stringify(payload);
    const staleHashes: string[] = [];
    const failures: PushDeliveryDiagnostic[] = [];

    const settled = await Promise.allSettled(
      rows.map(async (row) => {
        try {
          await transport.sendNotification(
            {
              endpoint: row.endpoint,
              keys: { p256dh: row.p256dh, auth: row.auth },
            },
            payloadJson,
            {
              TTL: 60 * 60,
              timeout: PUSH_TIMEOUT_MS,
              vapidDetails: {
                subject: vapid.subject,
                publicKey: vapid.publicKey,
                privateKey: vapid.privateKey,
              },
            },
          );
          return { ok: true as const };
        } catch (error) {
          const diagnostic = extractPushDeliveryDiagnostic(error, {
            endpointForProviderInference: row.endpoint,
          });
          logError("admin_push.delivery_failed", new Error("Push delivery failed"), {
            notificationType: input.type,
            statusCode: diagnostic.statusCode,
            provider: diagnostic.provider,
            reason: diagnostic.reason,
            category: diagnostic.category,
            code: diagnostic.code,
          });
          if (diagnostic.category === "stale_subscription") {
            staleHashes.push(row.endpointHash);
            return { ok: false as const, stale: true as const, diagnostic };
          }
          return { ok: false as const, stale: false as const, diagnostic };
        }
      }),
    );

    let successCount = 0;
    let failureCount = 0;
    let staleCount = 0;
    for (const result of settled) {
      if (result.status === "fulfilled" && result.value.ok) {
        successCount += 1;
      } else if (result.status === "fulfilled" && result.value.stale) {
        staleCount += 1;
        failureCount += 1;
        if (result.value.diagnostic) failures.push(result.value.diagnostic);
      } else if (result.status === "fulfilled") {
        failureCount += 1;
        if (result.value.diagnostic) failures.push(result.value.diagnostic);
      } else {
        failureCount += 1;
        failures.push(extractPushDeliveryDiagnostic(result.reason));
      }
    }

    if (staleHashes.length > 0) {
      for (const hash of staleHashes) {
        try {
          await db
            .delete(adminPushSubscriptions)
            .where(eq(adminPushSubscriptions.endpointHash, hash));
          logInfo("admin_push.subscription_stale_removed", { notificationType: input.type });
        } catch (error) {
          logError("admin_push.stale_cleanup_failed", error, { notificationType: input.type });
        }
      }
    }

    logInfo("admin_push.send_result", {
      notificationType: input.type,
      subscriptionCount: rows.length,
      successCount,
      failureCount,
      staleCount,
    });

    return {
      subscriptionCount: rows.length,
      successCount,
      failureCount,
      staleCount,
      failures,
    };
  } catch (error) {
    logError("admin_push.send_failed", error, { notificationType: input.type });
    return empty;
  }
}

/** Best-effort new-enquiry alert. Never throws. */
export async function notifyAdminsOfNewEnquiry(enquiryId: number): Promise<void> {
  try {
    if (!Number.isInteger(enquiryId) || enquiryId <= 0) return;
    const badgeCount = await countNewEnquiries();
    await sendAdminNotification({
      type: "new_enquiry",
      title: "New enquiry received",
      body: "A new quote request was submitted.",
      url: `/admin/enquiries/${enquiryId}`,
      tag: `enquiry-${enquiryId}`,
      badgeCount,
    });
  } catch (error) {
    logError("admin_push.send_failed", error, {
      notificationType: "new_enquiry",
      enquiryId,
    });
  }
}

export type AdminPushTestResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      diagnostic?: PushDeliveryDiagnostic;
    };

export async function sendAdminTestNotification(
  adminUserId: number,
  endpoint: string,
): Promise<AdminPushTestResult> {
  const assessment = assessWebPushVapidConfig();
  if (!assessment.configured) {
    return { ok: false, error: "Push notifications are not configured for this deployment." };
  }

  const trimmed = typeof endpoint === "string" ? endpoint.trim() : "";
  if (!trimmed) {
    return { ok: false, error: "Enable notifications on this device first." };
  }

  const testStamp = Date.now();
  const result = await sendAdminNotification({
    type: "test",
    title: "DaintyHand Admin",
    // Unique body + tag: some browsers suppress repeated identical banners.
    body: `Notifications are working. (${new Date(testStamp).toLocaleTimeString()})`,
    url: "/admin",
    tag: `admin-push-test-${testStamp}`,
    adminUserId,
    endpoint: trimmed,
  });

  if (result.subscriptionCount === 0) {
    return { ok: false, error: "No push subscription found for this device." };
  }
  if (result.successCount === 0) {
    const diagnostic = result.failures[0] ?? { category: "unknown" as const };
    return {
      ok: false,
      error: friendlyTestPushErrorMessage(diagnostic),
      diagnostic,
    };
  }
  return { ok: true };
}
