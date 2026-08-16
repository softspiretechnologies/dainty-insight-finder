import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { subscriptionMatchesVapidPublicKey, type PushDeliveryDiagnostic } from "@/lib/admin-push";
import {
  enableAdminPushOnDevice,
  getAdminPushBrowserSnapshot,
  getCurrentPushSubscription,
  unsubscribeAdminPushOnDevice,
  type AdminPushBrowserSnapshot,
} from "@/lib/admin-push-browser";
import {
  getAdminPushStatus,
  removeAdminPushSubscription,
  saveAdminPushSubscription,
  sendAdminPushTest,
} from "@/lib/api/admin/push";

type UiState = {
  configured: boolean;
  vapidPublicKey?: string;
  browser: AdminPushBrowserSnapshot["browser"];
  permission: AdminPushBrowserSnapshot["permission"];
  enabledOnDevice: boolean;
  statusLabel: string;
};

type ActionResult =
  | { ok: true }
  | { ok: false; error: string; diagnostic?: PushDeliveryDiagnostic };

function statusLabelFor(state: Omit<UiState, "statusLabel">): string {
  if (state.browser === "needs_install") {
    return "Add DaintyHand Admin to your Home Screen first";
  }
  if (state.browser === "unsupported") {
    return "Push notifications aren't available in this browser";
  }
  if (state.permission === "denied") {
    return "Notifications are blocked on this device";
  }
  if (state.enabledOnDevice) {
    return "Enabled on this device";
  }
  if (!state.configured) {
    return "Push notifications are not configured for this deployment";
  }
  return "Not enabled on this device";
}

export function AdminPushNotificationsSettings() {
  const [state, setState] = useState<UiState | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const [status, browser] = await Promise.all([
      getAdminPushStatus(),
      getAdminPushBrowserSnapshot(),
    ]);
    const configured = Boolean(status.configured);
    const vapidPublicKey =
      status.configured && "vapidPublicKey" in status ? status.vapidPublicKey : undefined;
    const next: UiState = {
      configured,
      vapidPublicKey,
      browser: browser.browser,
      permission: browser.permission,
      enabledOnDevice: Boolean(browser.localSubscription?.endpoint),
      statusLabel: "",
    };
    next.statusLabel = statusLabelFor(next);
    setState(next);
    return next;
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next = await refresh();
      if (cancelled) return;
      if (next.configured && next.permission === "granted" && next.enabledOnDevice) {
        const subscription = await getCurrentPushSubscription();
        const json = subscription?.toJSON();
        if (json?.endpoint && json.keys?.p256dh && json.keys?.auth) {
          await saveAdminPushSubscription({
            data: {
              endpoint: json.endpoint,
              keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
            },
          });
          if (!cancelled) await refresh();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const run = async (action: () => Promise<ActionResult>) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
      } else {
        setMessage("Done.");
      }
      await refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!state) {
    return (
      <section className="border border-border rounded-xl p-4 sm:p-5 space-y-3 bg-surface/20">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
          Notifications
        </p>
        <p className="text-sm text-muted">Checking this device…</p>
      </section>
    );
  }

  const canUsePushRuntime =
    state.configured && Boolean(state.vapidPublicKey) && state.browser === "available";

  const showEnable = canUsePushRuntime && !state.enabledOnDevice && state.permission !== "denied";
  const showTest = state.enabledOnDevice && canUsePushRuntime && state.permission !== "denied";
  const showDisable = state.enabledOnDevice;

  return (
    <section className="border border-border rounded-xl p-4 sm:p-5 space-y-4 bg-surface/20">
      <div className="flex gap-3">
        <div className="pt-0.5 shrink-0">
          <Bell className="w-4 h-4 text-muted" aria-hidden />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
            Notifications
          </p>
          <p className="font-medium text-sm">Get notified when a customer sends a new enquiry.</p>
          <p className="text-sm text-muted">
            Status: <span className="text-foreground">{state.statusLabel}</span>
          </p>
        </div>
      </div>

      {state.browser === "needs_install" ? (
        <p className="text-sm text-muted">
          Add DaintyHand Admin to your Home Screen first, then open the installed app to enable
          notifications.
        </p>
      ) : null}

      {state.browser === "unsupported" ? (
        <p className="text-sm text-muted">
          Push notifications aren&apos;t available in this browser.
        </p>
      ) : null}

      {!state.configured && state.browser === "available" && !state.enabledOnDevice ? (
        <p className="text-sm text-muted">
          Push notifications are not configured for this deployment.
        </p>
      ) : null}

      {!state.configured && state.enabledOnDevice ? (
        <p className="text-sm text-muted">
          This device still has a local push subscription, but server push is not configured. You
          can disable on this device to clear it.
        </p>
      ) : null}

      {state.permission === "denied" ? (
        <p className="text-sm text-muted">
          Notifications are blocked for this site. Open your device or browser notification
          settings, allow notifications for DaintyHand Admin, then return here to enable them.
        </p>
      ) : null}

      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        {showEnable ? (
          <Button
            type="button"
            className="w-full sm:w-auto h-11"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                if (!state.vapidPublicKey) {
                  return {
                    ok: false,
                    error: "Push notifications are not configured for this deployment.",
                  };
                }
                const enabled = await enableAdminPushOnDevice(state.vapidPublicKey);
                if (!enabled.ok) return enabled;
                return saveAdminPushSubscription({ data: enabled.subscription });
              })
            }
          >
            {busy ? "Working…" : "Enable notifications"}
          </Button>
        ) : null}

        {showTest ? (
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto h-11"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const subscription = await getCurrentPushSubscription();
                if (!subscription) {
                  return { ok: false, error: "Enable notifications on this device first." };
                }
                if (state.vapidPublicKey) {
                  const matches = subscriptionMatchesVapidPublicKey(
                    subscription.options?.applicationServerKey,
                    state.vapidPublicKey,
                  );
                  if (matches === false) {
                    return {
                      ok: false,
                      error:
                        "This device's push subscription is out of date. Disable notifications, then Enable again.",
                    };
                  }
                }
                const result = await sendAdminPushTest({
                  data: { endpoint: subscription.endpoint },
                });
                if (result.ok) setMessage("Test notification sent.");
                return result;
              })
            }
          >
            Send test notification
          </Button>
        ) : null}

        {showDisable ? (
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto h-11"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const subscription = await getCurrentPushSubscription();
                if (subscription) {
                  try {
                    await removeAdminPushSubscription({
                      data: { endpoint: subscription.endpoint },
                    });
                  } catch {
                    // Still clear the local subscription so the user can recover.
                  }
                }
                await unsubscribeAdminPushOnDevice();
                return { ok: true };
              })
            }
          >
            Disable on this device
          </Button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message && !error ? <p className="text-sm text-muted">{message}</p> : null}
    </section>
  );
}
