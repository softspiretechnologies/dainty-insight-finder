// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import type { Plugin } from "vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

/**
 * web-push / admin-push.server must never enter the browser Rollup graph.
 * createServerFn client stubs can still statically analyze dynamic imports;
 * stub those modules on non-SSR resolves.
 */
function stubAdminPushServerOnClient(): Plugin {
  const stubId = "\0dainty-admin-push-server-stub";
  return {
    name: "dainty-stub-admin-push-server-on-client",
    enforce: "pre",
    resolveId(id, _importer, options) {
      if (options?.ssr) return null;
      if (id === "web-push") return stubId;
      if (
        id === "@/lib/admin-push.server" ||
        id.endsWith("/admin-push.server") ||
        id.endsWith("/admin-push.server.ts")
      ) {
        return stubId;
      }
      return null;
    },
    load(id) {
      if (id !== stubId) return null;
      return `
        export default {};
        export function getWebPushVapidConfig() { return null; }
        export function getAdminPushStatusPayload() { return { configured: false }; }
        export function hashPushEndpoint() { return ""; }
        export function isStalePushSubscriptionError() { return false; }
        export async function countNewEnquiries() { return 0; }
        export async function saveAdminPushSubscriptionForUser() {
          return { ok: false, error: "unavailable" };
        }
        export async function removeAdminPushSubscriptionForUser() {
          return { ok: false, error: "unavailable" };
        }
        export async function sendAdminNotification() {
          return { subscriptionCount: 0, successCount: 0, failureCount: 0, staleCount: 0 };
        }
        export async function notifyAdminsOfNewEnquiry() {}
        export async function sendAdminTestNotification() {
          return { ok: false, error: "unavailable" };
        }
      `;
    },
  };
}

export default defineConfig({
  // Force Nitro node-server preset for Hostinger (and other Node hosts).
  // Without this, build skips Nitro outside Lovable and dist/server/server.js won't listen on a port.
  nitro: {
    preset: "node-server",
    // Supported by Nitro at runtime; the wrapper's narrowed config type omits this field.
    // @ts-expect-error routeRules is a valid Nitro option.
    routeRules: {
      "/uploads/**": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
      "/assets/**": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
      "/favicon.png": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
      "/apple-touch-icon.png": {
        headers: { "cache-control": "public, max-age=31536000, immutable" },
      },
      "/icon-192.png": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
      "/icon-512.png": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
      "/manifest.webmanifest": { headers: { "cache-control": "public, max-age=604800" } },
      "/admin.webmanifest": { headers: { "cache-control": "public, max-age=604800" } },
      // Push-only SW: avoid aggressive immutable caching so updates can roll out.
      "/admin-push-sw.js": {
        headers: {
          "cache-control": "public, max-age=0, must-revalidate",
          "content-type": "application/javascript; charset=utf-8",
          "service-worker-allowed": "/",
        },
      },
      "/og-image.jpg": { headers: { "cache-control": "public, max-age=604800" } },
      "/logo.jpg": { headers: { "cache-control": "public, max-age=604800" } },
    },
    // Hostinger requires a non-hidden output dir (`.output` is not detected).
    output: {
      dir: "dist",
      serverDir: "dist/server",
      publicDir: "dist/public",
    },
  },
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [stubAdminPushServerOnClient()],
    build: {
      target: "es2022",
      cssMinify: true,
    },
  },
});
