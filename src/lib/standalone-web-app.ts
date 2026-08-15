const ADMIN_LAUNCH_STORAGE_KEY = "daintyhand-admin-launch-shown";

export type StandaloneWindowLike = {
  matchMedia: (query: string) => { matches: boolean };
  navigator: { standalone?: boolean };
};

function currentWindow(): StandaloneWindowLike | null {
  if (typeof window === "undefined") return null;
  return window as unknown as StandaloneWindowLike;
}

function currentSessionStorage(): Pick<Storage, "getItem" | "setItem"> | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage;
}

/** True when running as an installed Home Screen / standalone web app (incl. iOS). */
export function isStandaloneWebApp(
  win: StandaloneWindowLike | null | undefined = currentWindow(),
): boolean {
  if (!win) return false;

  try {
    if (win.matchMedia("(display-mode: standalone)").matches) return true;
  } catch {
    // matchMedia can throw in unusual environments; fall through.
  }

  return win.navigator.standalone === true;
}

export function hasAdminLaunchSplashBeenShown(
  storage: Pick<Storage, "getItem"> | null | undefined = currentSessionStorage(),
): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(ADMIN_LAUNCH_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markAdminLaunchSplashShown(
  storage: Pick<Storage, "setItem"> | null | undefined = currentSessionStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(ADMIN_LAUNCH_STORAGE_KEY, "1");
  } catch {
    // Private mode / blocked storage — splash may replay once; never block Admin.
  }
}

/** Whether the Admin launch splash should run for this document session. */
export function shouldShowAdminLaunchSplash(options?: {
  win?: StandaloneWindowLike | null;
  storage?: Pick<Storage, "getItem" | "setItem"> | null;
}): boolean {
  const win = options && "win" in options ? options.win : currentWindow();
  const storage = options && "storage" in options ? options.storage : currentSessionStorage();

  if (!isStandaloneWebApp(win)) return false;
  if (hasAdminLaunchSplashBeenShown(storage)) return false;
  return true;
}

export { ADMIN_LAUNCH_STORAGE_KEY };
