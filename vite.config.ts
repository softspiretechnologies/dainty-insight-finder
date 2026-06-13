// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Force Nitro node-server preset for Hostinger (and other Node hosts).
  // Without this, build skips Nitro outside Lovable and dist/server/server.js won't listen on a port.
  nitro: {
    preset: "node-server",
    routeRules: {
      "/uploads/**": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
      "/assets/**": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
      "/favicon.png": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
      "/apple-touch-icon.png": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
      "/icon-192.png": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
      "/icon-512.png": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
      "/manifest.webmanifest": { headers: { "cache-control": "public, max-age=604800" } },
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
    build: {
      target: "es2022",
      cssMinify: true,
    },
  },
});
