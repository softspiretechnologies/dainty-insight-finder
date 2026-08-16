/* admin-push-sw v1.5 — push + notificationclick (+ optional badge) only. No fetch / cache. */

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function isSafeAdminPathname(pathname) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function sanitizeAdminUrl(candidate) {
  if (typeof candidate !== "string") return null;
  const raw = candidate.trim();
  if (!raw.startsWith("/admin")) return null;
  if (raw.startsWith("//")) return null;
  if (raw.includes("://")) return null;
  if (/[\0\r\n\\]/.test(raw)) return null;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) return null;
  try {
    const parsed = new URL(raw, self.location.origin);
    if (parsed.origin !== self.location.origin) return null;
    if (!isSafeAdminPathname(parsed.pathname)) return null;
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return null;
  }
}

function parsePayload(event) {
  try {
    if (!event.data) return null;
    const data = event.data.json();
    if (!data || data.version !== 1 || typeof data.title !== "string") return null;
    return data;
  } catch {
    return null;
  }
}

async function applyBadge(count) {
  try {
    if (!("setAppBadge" in self.navigator)) return;
    if (typeof count === "number" && count > 0) {
      await self.navigator.setAppBadge(count);
    } else if ("clearAppBadge" in self.navigator) {
      await self.navigator.clearAppBadge();
    }
  } catch {
    // Badge is supplemental — never block the notification.
  }
}

self.addEventListener("push", (event) => {
  const parsed = parsePayload(event);
  const title = parsed?.title || "DaintyHand Admin";
  const body = parsed?.body || "You have a new update.";
  const url = sanitizeAdminUrl(parsed?.url) || "/admin";
  const tag = typeof parsed?.tag === "string" ? parsed.tag : undefined;
  const badgeCount = typeof parsed?.badgeCount === "number" ? parsed.badgeCount : undefined;

  // Test-only: unique tags come from the server; renotify + requireInteraction help
  // browsers that suppress quiet/same-content banners while the Admin tab is focused.
  const isTest = parsed?.type === "test";
  const options = {
    body,
    icon: "/icon-192.png",
    badge: "/favicon.png",
    tag,
    data: { url },
    ...(isTest && tag
      ? {
          renotify: true,
          requireInteraction: true,
        }
      : {}),
  };

  const show = self.registration.showNotification(title, options);
  event.waitUntil(Promise.all([show, applyBadge(badgeCount)]));
});

async function openNotificationUrl(candidate) {
  const url = sanitizeAdminUrl(candidate) || "/admin";
  const absolute = new URL(url, self.location.origin).href;

  const allClients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  for (const client of allClients) {
    if (!("focus" in client)) continue;
    await client.focus();
    if ("navigate" in client) {
      try {
        await client.navigate(absolute);
        return;
      } catch {
        break;
      }
    }
    break;
  }
  if (self.clients.openWindow) {
    await self.clients.openWindow(absolute);
  }
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const candidate = event.notification.data && event.notification.data.url;
  event.waitUntil(openNotificationUrl(candidate));
});
