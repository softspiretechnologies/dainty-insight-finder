import { describe, expect, it } from "vitest";

import {
  ADMIN_LAUNCH_STORAGE_KEY,
  hasAdminLaunchSplashBeenShown,
  isStandaloneWebApp,
  markAdminLaunchSplashShown,
  shouldShowAdminLaunchSplash,
} from "@/lib/standalone-web-app";

function mockWindow({
  standaloneDisplay = false,
  iosStandalone = false,
}: {
  standaloneDisplay?: boolean;
  iosStandalone?: boolean;
}) {
  return {
    matchMedia: (query: string) => ({
      matches: query.includes("display-mode: standalone") ? standaloneDisplay : false,
    }),
    navigator: { standalone: iosStandalone },
  };
}

function mockStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: (key: string) => (key in data ? data[key] : null),
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
  };
}

describe("isStandaloneWebApp", () => {
  it("is true for display-mode: standalone", () => {
    expect(isStandaloneWebApp(mockWindow({ standaloneDisplay: true }))).toBe(true);
  });

  it("is true for iOS navigator.standalone", () => {
    expect(isStandaloneWebApp(mockWindow({ iosStandalone: true }))).toBe(true);
  });

  it("is false in a normal browser tab", () => {
    expect(isStandaloneWebApp(mockWindow({}))).toBe(false);
    expect(isStandaloneWebApp(null)).toBe(false);
  });
});

describe("admin launch splash session gate", () => {
  it("shows once for a standalone session", () => {
    const win = mockWindow({ standaloneDisplay: true });
    const storage = mockStorage();

    expect(shouldShowAdminLaunchSplash({ win, storage })).toBe(true);
    markAdminLaunchSplashShown(storage);
    expect(hasAdminLaunchSplashBeenShown(storage)).toBe(true);
    expect(storage.getItem(ADMIN_LAUNCH_STORAGE_KEY)).toBe("1");
    expect(shouldShowAdminLaunchSplash({ win, storage })).toBe(false);
  });

  it("never shows in a non-standalone browser", () => {
    const win = mockWindow({});
    const storage = mockStorage();
    expect(shouldShowAdminLaunchSplash({ win, storage })).toBe(false);
  });

  it("survives storage failures without throwing", () => {
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(hasAdminLaunchSplashBeenShown(broken)).toBe(false);
    expect(() => markAdminLaunchSplashShown(broken)).not.toThrow();
  });
});

describe("standalone chrome expectations", () => {
  it("treats standalone detection as the gate for hiding mobile admin chrome", () => {
    expect(isStandaloneWebApp(mockWindow({ standaloneDisplay: true }))).toBe(true);
    expect(isStandaloneWebApp(mockWindow({}))).toBe(false);
  });
});
