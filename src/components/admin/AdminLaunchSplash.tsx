import { useLayoutEffect, useState } from "react";

import { markAdminLaunchSplashShown, shouldShowAdminLaunchSplash } from "@/lib/standalone-web-app";
import { cn } from "@/lib/utils";

const EXIT_START_MS = 560;
const DONE_MS = 760;
const REDUCED_MOTION_MS = 120;

/**
 * Brief brand overlay for the installed DaintyHand Admin Home Screen app.
 * Mounted once on the Admin layout — not replayed on in-app navigation.
 */
export function AdminLaunchSplash() {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useLayoutEffect(() => {
    if (!shouldShowAdminLaunchSplash()) return;

    markAdminLaunchSplashShown();
    setVisible(true);

    let reduced = false;
    try {
      reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      reduced = false;
    }

    if (reduced) {
      const done = window.setTimeout(() => setVisible(false), REDUCED_MOTION_MS);
      return () => window.clearTimeout(done);
    }

    const exitTimer = window.setTimeout(() => setExiting(true), EXIT_START_MS);
    const doneTimer = window.setTimeout(() => setVisible(false), DONE_MS);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "fixed inset-0 z-[60] flex min-h-[100dvh] w-full items-center justify-center bg-background pointer-events-auto",
        exiting && "admin-launch-overlay-exit",
      )}
    >
      <div className={cn("px-6 text-center", !exiting && "admin-launch-brand")}>
        <p className="font-display text-4xl italic tracking-tight text-foreground sm:text-5xl">
          DaintyHand
        </p>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.35em] text-muted">Admin</p>
      </div>
    </div>
  );
}
