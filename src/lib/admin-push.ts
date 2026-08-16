import { z } from "zod";

/** Versioned Admin push payload — extend `type` later without rewriting send path. */
export type AdminNotificationPayload = {
  version: 1;
  type: "new_enquiry" | "test";
  title: string;
  body: string;
  url: string;
  tag?: string;
  badgeCount?: number;
};

export const adminPushSubscriptionInputSchema = z.object({
  endpoint: z
    .string()
    .trim()
    .min(1)
    .max(4096)
    .refine((value) => {
      try {
        const url = new URL(value);
        return url.protocol === "https:";
      } catch {
        return false;
      }
    }, "Push endpoint must be an HTTPS URL"),
  keys: z.object({
    p256dh: z.string().trim().min(1).max(256),
    auth: z.string().trim().min(1).max(128),
  }),
});

export type AdminPushSubscriptionInput = z.infer<typeof adminPushSubscriptionInputSchema>;

/**
 * Allow only same-origin Admin paths for notification navigation.
 * Rejects protocol-relative, absolute, and non-/admin destinations.
 */
export function sanitizeAdminNotificationUrl(candidate: unknown): string | null {
  if (typeof candidate !== "string") return null;
  const raw = candidate.trim();
  if (!raw.startsWith("/admin")) return null;
  if (raw.startsWith("//")) return null;
  if (raw.includes("://")) return null;
  if (/[\0\r\n\\]/.test(raw)) return null;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) return null;
  try {
    const parsed = new URL(raw, "https://daintyhand.invalid");
    if (parsed.origin !== "https://daintyhand.invalid") return null;
    if (!parsed.pathname.startsWith("/admin")) return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

/** Convert VAPID public key (URL-safe base64) to Uint8Array for PushManager.subscribe. */
export function vapidPublicKeyToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const padded = base64Url.trim().replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  const base64 = padded + "=".repeat(padLength);
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) {
    out[i] = raw.charCodeAt(i);
  }
  return out;
}

export type AdminPushSupportState =
  | "unsupported"
  | "needs_install"
  | "available"
  | "permission_denied"
  | "not_configured";

export type PushDeliveryFailureCategory =
  | "vapid_auth"
  | "stale_subscription"
  | "rate_limited"
  | "provider_temporary"
  | "network"
  | "unknown";

export type PushDeliveryDiagnostic = {
  category: PushDeliveryFailureCategory;
  statusCode?: number;
  reason?: string;
  provider?: "apple" | "fcm" | "mozilla" | "other";
  code?: string;
};

const SAFE_REASON_MAX = 160;

/** Decode URL-safe base64 into bytes (browser or Node Buffer-compatible). */
export function decodeBase64UrlToBytes(value: string): Uint8Array | null {
  try {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const padded = trimmed.replace(/-/g, "+").replace(/_/g, "/");
    const padLength = (4 - (padded.length % 4)) % 4;
    const base64 = padded + "=".repeat(padLength);
    if (typeof atob === "function") {
      const raw = atob(base64);
      const out = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
      return out;
    }
    return null;
  } catch {
    return null;
  }
}

export function uint8ArraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Compare a PushSubscription's applicationServerKey with the current VAPID public key.
 * Returns:
 * - true: matches
 * - false: different key
 * - null: inspection unavailable / unknown
 */
export function subscriptionMatchesVapidPublicKey(
  applicationServerKey: ArrayBuffer | ArrayBufferView | null | undefined,
  vapidPublicKeyBase64Url: string,
): boolean | null {
  if (applicationServerKey == null) return null;
  const expected = vapidPublicKeyToUint8Array(vapidPublicKeyBase64Url);
  let actual: Uint8Array;
  if (applicationServerKey instanceof ArrayBuffer) {
    actual = new Uint8Array(applicationServerKey);
  } else if (ArrayBuffer.isView(applicationServerKey)) {
    actual = new Uint8Array(
      applicationServerKey.buffer,
      applicationServerKey.byteOffset,
      applicationServerKey.byteLength,
    );
  } else {
    return null;
  }
  if (actual.length === 0) return null;
  return uint8ArraysEqual(actual, expected);
}

export function inferPushProviderFromEndpoint(
  endpoint: string,
): PushDeliveryDiagnostic["provider"] {
  try {
    const host = new URL(endpoint).hostname.toLowerCase();
    if (host.includes("push.apple.com") || host.endsWith(".apple.com")) return "apple";
    if (host.includes("fcm.googleapis.com") || host.includes("googleapis.com")) return "fcm";
    if (host.includes("mozilla") || host.includes("firefox")) return "mozilla";
    return "other";
  } catch {
    return "other";
  }
}

function truncateSafeReason(value: string): string {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= SAFE_REASON_MAX) return cleaned;
  return `${cleaned.slice(0, SAFE_REASON_MAX - 1)}…`;
}

/** Classify web-push / network failures without claiming VAPID mismatch from status alone. */
export function classifyPushDeliveryFailure(input: {
  statusCode?: number;
  code?: string;
  reason?: string;
}): PushDeliveryFailureCategory {
  const status = input.statusCode;
  const code = (input.code ?? "").toUpperCase();
  const reason = (input.reason ?? "").toLowerCase();

  if (status === 404 || status === 410) return "stale_subscription";
  if (status === 401 || status === 403) return "vapid_auth";
  if (status === 429) return "rate_limited";
  if (typeof status === "number" && status >= 500 && status <= 599) return "provider_temporary";

  if (
    code === "ENOTFOUND" ||
    code === "EAI_AGAIN" ||
    code === "ETIMEDOUT" ||
    code === "ECONNRESET" ||
    code === "ECONNREFUSED" ||
    code === "EHOSTUNREACH"
  ) {
    return "network";
  }

  if (
    reason.includes("enotfound") ||
    reason.includes("etimedout") ||
    reason.includes("econnreset") ||
    reason.includes("network")
  ) {
    return "network";
  }

  return "unknown";
}

/**
 * Extract SAFE diagnostic fields from a web-push / network error.
 * Never includes endpoint, keys, or VAPID material.
 */
export function extractPushDeliveryDiagnostic(
  error: unknown,
  options?: { endpointForProviderInference?: string },
): PushDeliveryDiagnostic {
  const statusCode =
    typeof error === "object" && error !== null && "statusCode" in error
      ? Number((error as { statusCode?: unknown }).statusCode)
      : undefined;
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : typeof error === "object" && error !== null && "errno" in error
        ? String((error as { errno?: unknown }).errno ?? "")
        : undefined;
  const name =
    typeof error === "object" && error !== null && "name" in error
      ? String((error as { name?: unknown }).name ?? "")
      : undefined;

  let reason: string | undefined;
  if (typeof error === "object" && error !== null && "body" in error) {
    const body = (error as { body?: unknown }).body;
    if (typeof body === "string" && body.trim()) {
      reason = truncateSafeReason(body);
    } else if (body && typeof body === "object") {
      try {
        reason = truncateSafeReason(JSON.stringify(body));
      } catch {
        reason = undefined;
      }
    }
  }
  if (!reason && error instanceof Error && error.message) {
    // Strip accidental endpoint URLs from messages.
    reason = truncateSafeReason(error.message.replace(/https?:\/\/\S+/gi, "[endpoint]"));
  }

  const category = classifyPushDeliveryFailure({
    statusCode: Number.isFinite(statusCode) ? statusCode : undefined,
    code: code || name,
    reason,
  });

  const provider = options?.endpointForProviderInference
    ? inferPushProviderFromEndpoint(options.endpointForProviderInference)
    : undefined;

  return {
    category,
    ...(Number.isFinite(statusCode) ? { statusCode } : {}),
    ...(reason ? { reason } : {}),
    ...(provider ? { provider } : {}),
    ...(code ? { code } : name ? { code: name } : {}),
  };
}

export function friendlyTestPushErrorMessage(diagnostic: PushDeliveryDiagnostic): string {
  switch (diagnostic.category) {
    case "vapid_auth":
      return "This device's push subscription does not match the server VAPID key. Disable notifications on this device, then Enable again.";
    case "stale_subscription":
      return "This device's notification subscription expired. Disable and enable notifications again.";
    case "network":
      return "The server couldn't reach the push service.";
    case "rate_limited":
      return "The push service is temporarily rate limiting requests. Try again shortly.";
    case "provider_temporary":
      return "The push service is temporarily unavailable.";
    default:
      return "Test notification could not be delivered.";
  }
}

export function isIosLikeUserAgent(userAgent: string, maxTouchPoints = 0): boolean {
  if (/iPad|iPhone|iPod/i.test(userAgent)) return true;
  // iPadOS may report as MacIntel with touch
  return /Macintosh/i.test(userAgent) && maxTouchPoints > 1;
}

export function detectAdminPushBrowserSupport(options: {
  hasServiceWorker: boolean;
  hasPushManager: boolean;
  hasNotification: boolean;
  isStandalone: boolean;
  userAgent: string;
  maxTouchPoints?: number;
}): Exclude<AdminPushSupportState, "not_configured" | "permission_denied"> {
  const iosLike = isIosLikeUserAgent(options.userAgent, options.maxTouchPoints ?? 0);
  if (iosLike && !options.isStandalone) {
    return "needs_install";
  }
  if (!options.hasServiceWorker || !options.hasPushManager || !options.hasNotification) {
    return "unsupported";
  }
  return "available";
}

export async function syncAdminAppBadge(
  count: number,
  nav: {
    setAppBadge?: (value?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  } | null = typeof navigator === "undefined"
    ? null
    : (navigator as Navigator & {
        setAppBadge?: (value?: number) => Promise<void>;
        clearAppBadge?: () => Promise<void>;
      }),
): Promise<void> {
  if (!nav) return;
  try {
    if (count > 0 && typeof nav.setAppBadge === "function") {
      await nav.setAppBadge(count);
      return;
    }
    if (typeof nav.clearAppBadge === "function") {
      await nav.clearAppBadge();
    }
  } catch {
    // Supplemental badge — never break Admin UI.
  }
}
