import { useLayoutEffect, useState } from "react";

import { markAdminLaunchSplashShown, shouldShowAdminLaunchSplash } from "@/lib/standalone-web-app";
import { cn } from "@/lib/utils";

/** Longer, calmer brand moment for installed Admin (~1.2s). */
const EXIT_START_MS = 900;
const DONE_MS = 1200;
const REDUCED_MOTION_MS = 160;

function prefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function finishEarlySplash(early: HTMLElement, onDone: () => void) {
  const reduced = prefersReducedMotion();
  if (reduced) {
    early.remove();
    document.documentElement.removeAttribute("data-admin-launch");
    onDone();
    return () => {};
  }

  const exitTimer = window.setTimeout(() => {
    early.classList.add("admin-launch-overlay-exit");
  }, EXIT_START_MS);
  const doneTimer = window.setTimeout(() => {
    early.remove();
    document.documentElement.removeAttribute("data-admin-launch");
    onDone();
  }, DONE_MS);

  return () => {
    window.clearTimeout(exitTimer);
    window.clearTimeout(doneTimer);
  };
}

/**
 * Completes the early standalone splash (if present) or shows a React fallback.
 * Mounted once on the Admin layout — not replayed on in-app navigation.
 */
export function AdminLaunchSplash() {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useLayoutEffect(() => {
    document.documentElement.classList.add("dh-admin");

    const early = document.getElementById("admin-early-splash");
    if (early) {
      return finishEarlySplash(early, () => {});
    }

    if (!shouldShowAdminLaunchSplash()) return;

    markAdminLaunchSplashShown();
    setVisible(true);

    if (prefersReducedMotion()) {
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

  useLayoutEffect(() => {
    return () => {
      document.documentElement.classList.remove("dh-admin");
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
