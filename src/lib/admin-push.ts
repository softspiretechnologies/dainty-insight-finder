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
