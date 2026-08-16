import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  subscriptionMatchesVapidPublicKey,
  type PushDeliveryDiagnostic,
} from "@/lib/admin-push";
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

type VapidDiagnosticsUi = {
  derivedPublicFingerprint: string | null;
  derivedPublicLength: number | null;
  privateLength: number | null;
  privateKeyValid: boolean;
  subjectValid: boolean;
  legacyPublicFingerprint: string | null;
  legacyPublicLength: number | null;
  legacyPublicMatchesDerived: boolean | null;
};

type UiState = {
  configured: boolean;
  vapidPublicKey?: string;
  vapidDiagnostics: VapidDiagnosticsUi | null;
  browser: AdminPushBrowserSnapshot["browser"];
  permission: AdminPushBrowserSnapshot["permission"];
  enabledOnDevice: boolean;
  /** Whether this device's PushSubscription applicationServerKey matches server derived public. */
  subscriptionMatchesServer: boolean | null;
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
  // Local subscription wins over server-config messaging so Disable remains discoverable.
  if (state.enabledOnDevice) {
    if (state.subscriptionMatchesServer === false) {
      return "Enabled, but subscription key is outdated — Disable then Enable";
    }
    return "Enabled on this device";
  }
  if (!state.configured) {
    return "Push notifications are not configured for this deployment";
  }
  return "Not enabled on this device";
}

function yesNo(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value ? "Yes" : "No";
}

export function AdminPushNotificationsSettings() {
  const [state, setState] = useState<UiState | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [diagnostic, setDiagnostic] = useState<PushDeliveryDiagnostic | null>(null);

  const refresh = async () => {
    const [status, browser] = await Promise.all([
      getAdminPushStatus(),
      getAdminPushBrowserSnapshot(),
    ]);
    const configured = Boolean(status.configured);
    const vapidPublicKey =
      status.configured && "vapidPublicKey" in status ? status.vapidPublicKey : undefined;
    const vapidDiagnostics =
      "vapidDiagnostics" in status && status.vapidDiagnostics
        ? (status.vapidDiagnostics as VapidDiagnosticsUi)
        : null;

    let subscriptionMatchesServer: boolean | null = null;
    if (vapidPublicKey && browser.localSubscription?.endpoint) {
      const live = await getCurrentPushSubscription();
      subscriptionMatchesServer = subscriptionMatchesVapidPublicKey(
        live?.options?.applicationServerKey,
        vapidPublicKey,
      );
    }

    // #region agent log
    fetch("http://127.0.0.1:7278/ingest/68b4041a-7dab-4ccf-9f80-2b4b1a1fa764", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "dfeff6" },
      body: JSON.stringify({
        sessionId: "dfeff6",
        runId: "iphone-403",
        hypothesisId: "J",
        location: "AdminPushNotificationsSettings.tsx:refresh",
        message: "subscription vs server key check",
        data: {
          configured,
          enabledOnDevice: Boolean(browser.localSubscription?.endpoint),
          subscriptionMatchesServer,
          hasVapidPublicKey: Boolean(vapidPublicKey),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    const next: UiState = {
      configured,
      vapidPublicKey,
      vapidDiagnostics,
      browser: browser.browser,
      permission: browser.permission,
      enabledOnDevice: Boolean(browser.localSubscription?.endpoint),
      subscriptionMatchesServer,
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
    setDiagnostic(null);
    try {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        if (result.diagnostic) setDiagnostic(result.diagnostic);
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

  const diagnostics = state.vapidDiagnostics;
  const legacyMismatch =
    diagnostics?.legacyPublicMatchesDerived === false &&
    Boolean(diagnostics.legacyPublicFingerprint);
  const subscriptionMismatch = state.subscriptionMatchesServer === false;

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
          Push notifications are not configured for this deployment. Set{" "}
          <span className="font-mono text-xs">WEB_PUSH_VAPID_PRIVATE_KEY</span> and{" "}
          <span className="font-mono text-xs">WEB_PUSH_VAPID_SUBJECT</span>.
        </p>
      ) : null}

      {!state.configured && state.enabledOnDevice ? (
        <p className="text-sm text-muted">
          This device still has a local push subscription, but server push is not configured. You
          can disable on this device to clear it.
        </p>
      ) : null}

      {subscriptionMismatch ? (
        <p className="text-sm text-muted">
          This device subscription was created with an older VAPID public key. That causes HTTP 403
          from the push provider when sending. Tap Disable on this device, then Enable notifications
          again (no Hostinger key changes needed for this).
        </p>
      ) : null}

      {legacyMismatch ? (
        <p className="text-sm text-muted">
          Legacy configured public key mismatch:{" "}
          <span className="font-mono text-xs">WEB_PUSH_VAPID_PUBLIC_KEY</span> does not match the
          public key derived from the private key. Runtime uses the derived key; you can remove the
          legacy public env after redeploy. This does not block Enable or Disable.
        </p>
      ) : null}

      {state.permission === "denied" ? (
        <p className="text-sm text-muted">
          Notifications are blocked for this site. Open your device or browser notification
          settings, allow notifications for DaintyHand Admin, then return here to enable them.
        </p>
      ) : null}

      {diagnostics ? (
        <div className="space-y-1 rounded-lg border border-border/60 bg-background/40 px-3 py-2.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
            VAPID diagnostics
          </p>
          <p className="text-xs font-mono text-foreground">
            Derived public fingerprint: {diagnostics.derivedPublicFingerprint ?? "—"}
          </p>
          <p className="text-xs font-mono text-foreground">
            Derived public length: {diagnostics.derivedPublicLength ?? "—"}
          </p>
          <p className="text-xs font-mono text-foreground">
            Private length: {diagnostics.privateLength ?? "—"}
          </p>
          <p className="text-xs font-mono text-foreground">
            Private key valid: {yesNo(diagnostics.privateKeyValid)}
          </p>
          <p className="text-xs font-mono text-foreground">
            Subject valid: {yesNo(diagnostics.subjectValid)}
          </p>
          <p className="text-xs font-mono text-foreground">
            Device subscription matches server: {yesNo(state.subscriptionMatchesServer)}
          </p>
          {diagnostics.legacyPublicFingerprint ? (
            <>
              <p className="text-xs font-mono text-foreground">
                Legacy public fingerprint: {diagnostics.legacyPublicFingerprint}
              </p>
              <p className="text-xs font-mono text-foreground">
                Legacy public length: {diagnostics.legacyPublicLength ?? "—"}
              </p>
              <p className="text-xs font-mono text-foreground">
                Legacy public matches derived: {yesNo(diagnostics.legacyPublicMatchesDerived)}
              </p>
            </>
          ) : null}
        </div>
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
                  // #region agent log
                  fetch("http://127.0.0.1:7278/ingest/68b4041a-7dab-4ccf-9f80-2b4b1a1fa764", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "X-Debug-Session-Id": "dfeff6",
                    },
                    body: JSON.stringify({
                      sessionId: "dfeff6",
                      runId: "iphone-403",
                      hypothesisId: "J",
                      location: "AdminPushNotificationsSettings.tsx:sendTest",
                      message: "pre-send subscription key check",
                      data: { matches },
                      timestamp: Date.now(),
                    }),
                  }).catch(() => {});
                  // #endregion
                  if (matches === false) {
                    return {
                      ok: false,
                      error:
                        "This device's push subscription does not match the server VAPID key. Disable notifications on this device, then Enable again.",
                      diagnostic: { category: "vapid_auth", statusCode: 403 },
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
      {diagnostic?.statusCode ? (
        <p className="text-xs font-mono text-muted">Diagnostic: HTTP {diagnostic.statusCode}</p>
      ) : null}
      {message && !error ? <p className="text-sm text-muted">{message}</p> : null}
    </section>
  );
}
