# Production operations

## Required deployment configuration

- `DATABASE_URL`: MySQL connection URL.
- `ADMIN_SESSION_SECRET`: random secret of at least 32 characters.
- `UPLOADS_DIR`: absolute path to the persistent, writable upload directory; optional to the parser for development compatibility, but required operationally for Hostinger persistence.
- `VITE_SITE_URL`: public HTTPS origin used for canonical and structured-data URLs.
- `VITE_GA_ID`: optional Google Analytics measurement ID.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: seed-time credentials only; do not keep them in the public build environment when they are no longer needed.
- `WEB_PUSH_VAPID_PUBLIC_KEY`, `WEB_PUSH_VAPID_PRIVATE_KEY`, `WEB_PUSH_VAPID_SUBJECT`: optional Web Push (Admin notifications). Generate once locally with `npm run generate:vapid-keys`. Use the same stable keys across redeployments. The private key is secret — never commit it or expose it to the browser. Do not casually regenerate production VAPID keys (that invalidates existing device subscriptions). Subject example: `mailto:admin@daintyhand.in`. Validate a local pair without printing secrets via `npm run validate:vapid-keys`. If these are missing, Admin continues to work and Settings shows that push is not configured; public enquiry submission is unaffected. `configured` only means env vars are present — the pair must also be cryptographically matching.

Production startup rejects missing `DATABASE_URL`, `ADMIN_SESSION_SECRET`, or `VITE_SITE_URL`. The health check at `/health` returns 200 only when MySQL and the upload directory are available; it returns 503 without revealing connection or path details otherwise.

## Deploy

1. Back up MySQL and the persistent upload directory.
2. Install dependencies on the same Linux platform that will run the application with `npm ci`. Sharp contains native components, so do not upload a macOS-built `node_modules` or server bundle to Linux.
3. Apply `drizzle/migrations/0007_add_blog_posts.sql` (or run the normal migration process).
4. Build with the production environment configured: `npm run build` (Hostinger Build Command). This runs `db:ensure`, then `db:verify`, then `build:app`. Do not run `db:migrate` or `db:seed` during deploy.
5. Keep `UPLOADS_DIR` outside release directories and preserve its ownership across deployments.
6. Restart the Node application.
7. Run `SITE_URL=https://your-origin.example npm run smoke`.
8. Confirm an admin login, a representative image, `/sitemap.xml`, and a blog post manually.

## Headers and CSP

The application sends `nosniff`, a strict-origin referrer policy, a restrictive permissions policy, and HSTS only when the request is confirmed as HTTPS. CSP starts in report-only mode because TanStack Start emits required inline bootstrap and JSON-LD content. Review browser/reporting violations before enforcing it; `unsafe-eval` is not permitted.

## Browser tests

Playwright refuses remote targets and requires a database name containing `test` or `e2e`. CI provides an ephemeral MySQL service, seeds it, and runs the broad Chromium suite plus a scoped WebKit matrix. Never set its `DATABASE_URL` to the production database.

- `npm run test:e2e`: Chromium critical/responsive/accessibility coverage, desktop WebKit accessibility and critical paths, and focused iPhone 13/iPad Pro 11 WebKit coverage.
- `npm run test:e2e:chromium`: Chromium only.
- `npm run test:e2e:webkit`: the scoped desktop/iPhone/iPad WebKit projects only.
- `npm run test:visual`: opt-in Chromium visual regression. This requires committed baselines generated on the same OS/browser environment and is intentionally not a default CI gate.

The visual suite uses seeded E2E data, reduced motion, loaded local fonts, and named representative viewports. Update baselines intentionally with:

```bash
VISUAL_REGRESSION=1 npx playwright test e2e/visual.spec.ts \
  --project=visual-chromium --update-snapshots
```

WebKit is a strong Safari-engine check, but it does not replace testing on physical iPhone/iPad hardware. Before a major launch, verify the public Sheet, WhatsApp panel, admin bottom navigation, date input, and form keyboard behavior on current iOS Safari.

## Lighthouse procedure

Run Lighthouse against a production build or the deployed HTTPS origin, primarily with mobile emulation. Scores from local development mode are not representative.

```bash
npm run build:app
npm run start
npx lighthouse http://127.0.0.1:3000/ --preset=perf \
  --only-categories=performance,accessibility,best-practices,seo \
  --view
```

Repeat for `/catalog` and one `/catalog/:slug` URL. On the deployed origin, replace the local URL with HTTPS. Treat Accessibility, Best Practices, and SEO scores below 95 as release-review items. Monitor Performance and Core Web Vitals, but do not make the shared CI job fail on Lighthouse until the runner and serving environment are deterministic.

## Performance and asset notes

- Public catalog images render through `OptimizedImage` with explicit dimensions/aspect ratios, route-specific `sizes`, lazy loading by default, and one high-priority image on the main catalog surfaces.
- Runtime admin uploads generate WebP variants up to the source width (640/960/1440 where useful). The stored largest WebP path allows `srcset` generation. Small bundled seed images are already only 30–68 KB and at most 640 px wide, so generating duplicate widths would not provide a useful responsive set.
- The largest bundled editorial image is about 128 KB. No multi-megabyte public image is shipped. Below-fold galleries remain lazy.
- Fontsource imports are limited to the five used faces: Playfair Display 700 normal/600 italic, Inter 400/500, and JetBrains Mono 400. Fontsource's Unicode-range CSS lets the browser fetch only required subsets.
- Root data is requested once and reused through router context. Public list/settings/services/testimonial reads use a short server cache; product visibility-sensitive detail reads go to MySQL.

Use a production Lighthouse trace before changing hydration or splitting bundles further; the current audit did not identify a safe, design-neutral removal of public JavaScript.

## Process-local cache consistency

`src/lib/cache.server.ts` is an in-memory cache and therefore belongs to one Node process only. All product, category, settings, service, and testimonial admin mutations call `clearDataCache()` in the process handling the mutation. Blog reads are uncached. Product detail intentionally bypasses the cache so hidden/deleted products and edits use current database truth.

Another Node worker cannot receive that in-memory invalidation. The default TTL is therefore capped at 10 seconds, limiting temporary staleness for public lists, homepage featured products, services, testimonials, and site settings without adding external infrastructure. This is acceptable for a single Hostinger Node process and bounded for a small multi-worker setup. If the deployment later adds many long-lived workers and needs immediate cross-worker list consistency, reassess with a shared invalidation mechanism; do not introduce Redis solely for the current topology.

## Mobile viewport and safe-area risk

Sheets and the WhatsApp panel use `100dvh`; fixed edge controls account for the relevant `safe-area-inset-*` values. Small-screen inputs are forced to at least 16 px to avoid iOS focus zoom. Error and 404 actions stack at narrow widths, and the server fallback error page handles long reference IDs.

Automated WebKit covers 390×844, 844×390, 932×430, iPad portrait/landscape, and desktop Safari profiles. The remaining uncertainty is the physical iOS on-screen keyboard, browser chrome collapsing/expanding, device-specific notches, and Hostinger/network timing. Avoid JavaScript viewport-height hacks unless a repeatable physical-device defect is observed.

## Backups

See [BACKUP_AND_RESTORE.md](./BACKUP_AND_RESTORE.md). Configure off-host retention and test restores before treating the process as production-ready.
