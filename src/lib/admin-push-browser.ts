import {
  detectAdminPushBrowserSupport,
  sanitizeAdminNotificationUrl,
  subscriptionMatchesVapidPublicKey,
  syncAdminAppBadge,
  vapidPublicKeyToUint8Array,
  type AdminPushSupportState,
} from "@/lib/admin-push";
import { isStandaloneWebApp } from "@/lib/standalone-web-app";

export const ADMIN_PUSH_SW_URL = "/admin-push-sw.js";
export const ADMIN_PUSH_SW_SCOPE = "/admin/";

export type AdminPushBrowserSnapshot = {
  browser: Exclude<AdminPushSupportState, "not_configured" | "permission_denied">;
  permission: NotificationPermission | "unsupported";
  localSubscription: PushSubscriptionJSON | null;
};

export function getAdminPushBrowserSupport(): Exclude<
  AdminPushSupportState,
  "not_configured" | "permission_denied"
> {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return detectAdminPushBrowserSupport({
      hasServiceWorker: false,
      hasPushManager: false,
      hasNotification: false,
      isStandalone: false,
      userAgent: "",
    });
  }
  return detectAdminPushBrowserSupport({
    hasServiceWorker: "serviceWorker" in navigator,
    hasPushManager: "PushManager" in window,
    hasNotification: "Notification" in window,
    isStandalone: isStandaloneWebApp(),
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
  });
}

export async function registerAdminPushServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers are not supported.");
  }
  const registration = await navigator.serviceWorker.register(ADMIN_PUSH_SW_URL, {
    scope: ADMIN_PUSH_SW_SCOPE,
    updateViaCache: "none",
  });
  try {
    await registration.update();
  } catch {
    // Best-effort refresh; existing registration still usable.
  }
  return registration;
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  try {
    await registerAdminPushServiceWorker();
  } catch {
    return null;
  }
  const ready = await navigator.serviceWorker.ready;
  return ready.pushManager.getSubscription();
}

export async function getAdminPushBrowserSnapshot(): Promise<AdminPushBrowserSnapshot> {
  const browser = getAdminPushBrowserSupport();
  if (browser === "needs_install" || browser === "unsupported") {
    return { browser, permission: "unsupported", localSubscription: null };
  }
  if (typeof Notification === "undefined") {
    return { browser: "unsupported", permission: "unsupported", localSubscription: null };
  }
  const permission = Notification.permission;
  const subscription = permission === "granted" ? await getCurrentPushSubscription() : null;
  return {
    browser,
    permission,
    localSubscription: subscription ? subscription.toJSON() : null,
  };
}

type SubscriptionLike = {
  options?: { applicationServerKey?: BufferSource | null };
  unsubscribe: () => Promise<boolean>;
  toJSON: () => PushSubscriptionJSON;
};

/**
 * Reuse an existing PushSubscription only when its applicationServerKey matches
 * the current VAPID public key. Otherwise unsubscribe and create a fresh one.
 * Call only from an explicit Enable action.
 */
export async function resolveSubscriptionForCurrentVapidKey(options: {
  vapidPublicKey: string;
  getSubscription: () => Promise<SubscriptionLike | null>;
  subscribe: (applicationServerKey: Uint8Array) => Promise<{ toJSON: () => PushSubscriptionJSON }>;
}): Promise<
  | { ok: true; subscription: { endpoint: string; keys: { p256dh: string; auth: string } } }
  | { ok: false; error: string }
> {
  let subscription = await options.getSubscription();

  if (subscription) {
    const matches = subscriptionMatchesVapidPublicKey(
      subscription.options?.applicationServerKey,
      options.vapidPublicKey,
    );
    if (matches === false) {
      try {
        await subscription.unsubscribe();
      } catch {
        // Continue — subscribe may still succeed.
      }
      subscription = null;
    }
  }

  if (!subscription) {
    const created = await options.subscribe(vapidPublicKeyToUint8Array(options.vapidPublicKey));
    const json = created.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return { ok: false, error: "Could not read the push subscription from this browser." };
    }
    return {
      ok: true,
      subscription: {
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      },
    };
  }

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return { ok: false, error: "Could not read the push subscription from this browser." };
  }

  return {
    ok: true,
    subscription: {
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    },
  };
}

/**
 * Enable notifications — must only be called from a direct user gesture.
 * Returns the subscription JSON for the caller to persist via Admin server APIs.
 */
export async function enableAdminPushOnDevice(
  vapidPublicKey: string,
): Promise<
  | { ok: true; subscription: { endpoint: string; keys: { p256dh: string; auth: string } } }
  | { ok: false; error: string }
> {
  const browser = getAdminPushBrowserSupport();
  if (browser === "needs_install") {
    return {
      ok: false,
      error:
        "Add DaintyHand Admin to your Home Screen first, then open the installed app to enable notifications.",
    };
  }
  if (browser === "unsupported") {
    return { ok: false, error: "Push notifications aren't available in this browser." };
  }

  if (Notification.permission === "denied") {
    return {
      ok: false,
      error:
        "Notifications are blocked on this device. You can enable them later in your device/browser settings.",
    };
  }

  if (Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return {
        ok: false,
        error:
          "Notifications are blocked on this device. You can enable them later in your device/browser settings.",
      };
    }
  }

  try {
    const registration = await registerAdminPushServiceWorker();
    await navigator.serviceWorker.ready;
    return resolveSubscriptionForCurrentVapidKey({
      vapidPublicKey,
      getSubscription: async () => {
        const sub = await registration.pushManager.getSubscription();
        return sub as SubscriptionLike | null;
      },
      subscribe: (applicationServerKey) =>
        registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as BufferSource,
        }),
    });
  } catch {
    return { ok: false, error: "Could not enable notifications on this device." };
  }
}

/** Unsubscribe the browser PushSubscription (caller should remove the server row first). */
export async function unsubscribeAdminPushOnDevice(): Promise<string | null> {
  const subscription = await getCurrentPushSubscription();
  if (!subscription) return null;
  const endpoint = subscription.endpoint;
  try {
    await subscription.unsubscribe();
  } catch {
    // Local leftover is acceptable once the server row is gone.
  }
  return endpoint;
}

export { sanitizeAdminNotificationUrl, syncAdminAppBadge, vapidPublicKeyToUint8Array };
