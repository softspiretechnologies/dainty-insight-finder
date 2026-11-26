# DaintyHand Project Context

## Documentation contract

`PROJECT_CONTEXT.md` is the canonical current-state technical and product reference for DaintyHand.

Source code is authoritative if documentation and implementation disagree.

Any change affecting user-visible behavior, Admin functionality, routes,
database/schema, authentication/security, uploads, integrations,
environment variables, deployment, testing strategy, or major architecture
must update the relevant section of this document in the same change.

Keep this document concise and current. Do not append a development diary.

---

## Quick Context

**Product:** Marketing + catalog site for **DaintyHand** (Kerala handcrafted gifting / celebration studio). No checkout, no customer accounts. Orders/leads continue via WhatsApp after optional DB enquiry capture.

**Stack:** TanStack Start (React 19 + TypeScript), Vite 7, TanStack Router, Nitro SSR, Tailwind CSS v4, Zod, Drizzle ORM + mysql2, Sharp, web-push. Package name: `daintyhand`.

**Production:** Hostinger Node.js (`npm run build` → `db:ensure` → `db:verify` → `build:app`). Entry: `dist/server/hostinger-entry.mjs`. Do **not** run `db:migrate` or `db:seed` as routine production deploy.

**Public vs Admin:** Public site under `/`, `/catalog`, `/services`, `/blog`, `/contact`, `/custom`. Admin under `/admin/*` (session cookie + `requireAdmin()` on server functions).

**Database:** MySQL/MariaDB. Tables: `categories`, `products`, `site_settings`, `testimonials`, `services`, `admin_users`, `admin_login_attempts`, `blog_posts`, `enquiries`, `admin_push_subscriptions`. Static fallback when `DATABASE_URL` unset (`src/data/products.ts`).

**Uploads:** Persistent dir (`UPLOADS_DIR` or Hostinger `../uploads`) + bundled `public/uploads`. Served at `/uploads/*`. Admin uploads → Sharp WebP variants. Product delete removes that product’s `imagePath`.

**Auth:** bcrypt + signed httpOnly cookie `dainty_admin_session`; `session_version` for revocation; login rate limits in DB.

**Enquiries:** Saved to MySQL first; WhatsApp continue is optional. Push after insert is best-effort and must never fail the customer response.

**Push:** VAPID public key **derived from** `WEB_PUSH_VAPID_PRIVATE_KEY` at runtime. `WEB_PUSH_VAPID_PUBLIC_KEY` is legacy/optional (not runtime source of truth). Admin SW `public/admin-push-sw.js` is push-only (no fetch cache).

**Products Admin:** Full editor + visibility (`isActive`) + homepage featured (cap 6) + **Bulk Quick Add** (`/admin/products/bulk`, hidden drafts, max 20) + **Duplicate** (copies image file to new path).

**Tests:** Vitest (`npm run test`), Playwright Chromium + scoped WebKit (`test:e2e`), opt-in visual (`test:visual`), smoke (`npm run smoke`). CI: lint + Vitest + `build:app`; separate e2e job with ephemeral MySQL.

**Admin nav performance:** Public `getRootPageData()` is skipped on `/admin` paths. Admin `beforeLoad` validates the UI session on Admin-tree **enter** only (`stay` does not call `getSessionAdmin()`). Child page-data loaders start immediately; shell user/badge refresh via `getAdminShellData` (COUNT only) with 15s staleTime. Server functions still `requireAdmin()`. No global `defaultStaleTime`.

**Safety:** Never print secrets/VAPID private keys. Trust code over stale docs. Prefer `docs/database.md` + `docs/PRODUCTION_OPERATIONS.md` for DB/deploy details.

**Canonical docs:** this file (current state) · `README.md` (entrypoint) · `docs/database.md` · `docs/PRODUCTION_OPERATIONS.md` · `docs/enquiries.md` · `docs/BACKUP_AND_RESTORE.md`

---

## Context Index

| Task | Read |
| --- | --- |
| Products / bulk / duplicate | Admin Features → Products |
| Enquiries / leads | Enquiry / Lead Flow |
| Push / VAPID | Notifications; Admin PWA |
| Database / migrations | Database & Schema; `docs/database.md` |
| Uploads / images | Upload & Image Architecture |
| Deployment / Hostinger | Deployment / Hostinger; `docs/PRODUCTION_OPERATIONS.md` |
| Auth / sessions | Authentication & Security |
| Tests / CI | Testing & CI |
| Env vars | Environment Variables |
| Routes map | Important Routes |

---

## Product / Business Scope

- Brand: DaintyHand — handcrafted gifts, hampers, invitations, celebration services (founder Nafisa; based in Perinthalmanna, Kerala).
- Public goal: showcase catalog/services/journal and convert to WhatsApp enquiries.
- Admin goal: manage catalog, leads, content, and site contact settings on mobile (including installed Admin PWA).
- Out of scope (current): ecommerce checkout, payments, customer accounts, inventory, CRM automation beyond enquiry statuses + WhatsApp, Instagram scraping, AI generation, CSV import.

---

## Architecture

- **SSR app** via TanStack Start + Nitro `node-server`.
- **File-based routes** in `src/routes/` → `src/routeTree.gen.ts` (generated; do not hand-edit).
- **Data access:** `createServerFn` in `src/lib/api/*` so MySQL/Sharp/web-push stay server-side.
- **Admin page loads:** Prefer consolidated page-data server functions (one `requireAdmin()` + concurrent queries) over multiple independent `createServerFn` calls per route. Shell uses `getAdminShellData` (user + COUNT-only badge); dashboard uses `getAdminDashboardPageData`; products list/editor and enquiries list use matching page-data endpoints. Products/enquiries **list** queries project only columns the list UI renders.
- **Router:** `defaultPreload: "intent"` with `defaultPreloadStaleTime: 30_000`. No global `defaultStaleTime` (public stays fresh). Admin-only short windows: `/admin` shell, dashboard, products list/editor (`15_000`); enquiries list (`10_000`). Mutations that leave for a cached Admin list call `router.invalidate()` first.
- **Admin navigation guards:** Root `beforeLoad` does not fetch public categories/settings under `/admin`. Admin `beforeLoad` runs `getSessionAdmin()` on enter/preload of the Admin tree, not on `stay` child transitions. This is a UI guard only — private endpoints still `requireAdmin()` (including `session_version`).
- **Public layout:** `PageShell` (header, footer, floating WhatsApp).
- **Admin layout:** `AdminShell` (desktop sidebar + mobile bottom nav + “More” sheet); login route without shell chrome.
- **Config:** `src/lib/site.ts` (brand defaults), `src/lib/config.server.ts` (server env), path alias `@/*` → `src/*`.
- **UI:** Tailwind v4 tokens in `src/styles.css`; self-hosted `@fontsource` (Playfair Display, Inter, JetBrains Mono); shadcn-style primitives under `src/components/ui/`.
- **Not used:** TanStack Query; Google Fonts CDN; Cloudflare as production target.

```
src/
  routes/           # public + admin pages, sitemap, robots, health, uploads
  components/site/  # public chrome
  components/admin/ # AdminShell, push settings, field helpers, splash
  components/ui/    # shared primitives + OptimizedImage
  lib/api/          # createServerFn catalog + admin modules
  lib/*.server.ts   # auth, data, uploads, push, rate limits, cache
  db/               # schema + pool
  data/             # static fallback catalog / blog seed content
```

---

## Public Features

- **Home (`/`)** — editorial marketing: categories, featured products (from DB when configured), services/moments, testimonials, CTAs.
- **Catalog (`/catalog`)** — category + page search params; paginated grid; enquire / quote entry points.
- **Product (`/catalog/$slug`)** — detail, details list, price-from display (₹ formatting), quote sheet → enquiry.
- **Services (`/services`)** — celebration services from DB (fallback static); enquiry from service context.
- **Blog / Journal (`/blog`, `/blog/$slug`)** — published posts from MySQL (static fallback available).
- **Contact (`/contact`)** — channels + enquiry form (required markers, invalid field rings, submit summary, focus first error). Same form in product/service enquiry sheets.
- **Custom order (`/custom`)** — validated client form that opens WhatsApp with a prefilled brief (**does not** insert an `enquiries` row).
- **Floating WhatsApp** — guided prompts; uses site settings / categories from root context.
- **SEO** — per-route `head()` meta; `/sitemap.xml` (static + products + blog); `/robots.txt`.
- **Images** — `OptimizedImage` + `/uploads/$` handler; responsive `sizes` / WebP where available.
- **Analytics** — optional `VITE_GA_ID` gtag in root head.
- **Health** — `GET /health` (DB + uploads readiness; no secrets).

---

## Admin Features

### Dashboard

`/admin` — summary cards including new enquiry count; recent activity; links into sections.

### Enquiries

`/admin/enquiries`, `/admin/enquiries/$enquiryId` — list/filter/search; statuses `new | contacted | quoted | confirmed | lost`; WhatsApp/call actions; internal notes; summary badge in nav.

### Products

`/admin/products`, `/admin/products/$productId` (`new` for create).

#### Standard product editor

- Fields: name, slug, category, blurb, description, details, priceFrom, image upload, `isActive`, `featuredOnHomepage`.
- Validation via `productInputSchema` (full content required for this path).
- Homepage featured capped (helpers in `homepage-featured.ts`; UI enforces/feedback).
- Toggle active / featured from list without full edit.

#### Bulk Quick Add

- Route: `/admin/products/bulk` (linked from products list).
- Multi-image select → per-image cards (name, category, optional price).
- Batch “apply to all” for category/price; max **20** items (`MAX_BULK_QUICK_PRODUCTS`).
- Server: `bulkCreateAdminProducts` — one request; unique slugs; **`isActive: false`**, **`featuredOnHomepage: false`**; blurb/description default to name; `details: []`.
- Failure: reverse-delete created rows + orphan uploads when practical.
- Success: hidden drafts messaging; leave-guard when unsaved.

#### Duplicate Product

- List action (mobile sheet + desktop): `duplicateAdminProduct`.
- Copies category, blurb, description, details, priceFrom; name `"{name} Copy"`; new unique slug; hidden + not featured.
- **Copies image file** to a new path (`copyUploadedProductImage`) so deleting one product does not remove the other’s image.

### Categories

`/admin/categories` — labels, blurbs, images, reorder. List/preview thumbs use `OptimizedImage` + generated variants.

### Services

`/admin/services` — service cards + page intro/footer copy; reorder; image upload. List thumbs use `OptimizedImage` + generated variants.

### Testimonials

`/admin/testimonials` — quotes + section heading.

### Blog

`/admin/blog`, `/admin/blog/$postId` — draft/publish, slug, excerpt, content, featured image, SEO fields.

The bundled journal guides in `src/data/blog.ts` include local hamper ordering and bouquet buying guides. Database posts with matching slugs override the bundled entries (including unpublished rows); existing production content is never overwritten by deploy. Content priorities and editorial review guidance: `docs/SEO_CONTENT_PLAN.md`.

### Settings / Account

`/admin/settings` — WhatsApp, email, Instagram, founder, location; **change password**; logout-all-sessions (bumps `session_version`); **push notification** enable/test UI.

Secondary Admin list/editor routes (categories, services, testimonials, blog, settings) show `AdminPagePending` in the content area while loaders run; the Admin shell stays visible.

### Admin PWA

- Manifest: `public/admin.webmanifest` (`start_url` `/admin`, scope `/admin`).
- Public manifest: `public/manifest.webmanifest`.
- Route-aware manifest selection (`pwa-identity`).
- Installed-app launch: early boot script + `AdminLaunchSplash` (once per session, ~550ms); standalone hides redundant mobile top chrome via CSS.

### Push Notifications

- Settings UI + `admin-push-sw.js` (push-only; no fetch cache).
- Notification URLs must be `/admin` or `/admin/...` (same-origin). Prefixes like `/administrator` are rejected.
- Click: reuse a focused Admin window when `navigate` succeeds; if `navigate` throws or no window exists, `openWindow`.
- Settings success copy: enabled / test sent / disabled.
- Subscriptions stored per admin user; test send; enquiry-triggered notify.
- Missing/malformed VAPID → Admin still works; push marked unavailable; public enquiry unaffected.

---

## Enquiry / Lead Flow

1. Contact / product / service enquiry UI validates (required `*` on name, WhatsApp, message; destructive invalid rings; submit-level alert after a failed send; focus/scroll to the first customer-visible error) and calls `submitEnquiry`.
2. Server inserts `enquiries` (honeypot + IP rate limit); resolves product/service names server-side.
3. Returns `{ id, whatsappMessage }`; UI offers optional WhatsApp continue.
4. Best-effort Admin Web Push; failures logged only.
5. Admin manages status/notes; never public.

Custom order page remains WhatsApp-only (no lead row).

Details: `docs/enquiries.md`.

---

## Authentication & Security

- Login: `loginAdmin` — bcrypt verify, rate limits (`admin_login_attempts` scopes), sets signed cookie.
- Session payload includes `sessionVersion`; must match `admin_users.session_version`.
- Password change / logout-all increments version (revokes other sessions).
- Cookie: httpOnly, SameSite=Lax, Secure in production, ~7-day maxAge.
- All mutating/private admin server functions call `requireAdmin()` (enforced in authorization tests). Skipping the Admin-tree `stay` UI session fetch does **not** skip this check.
- Direct unauthenticated `/admin/*` (except login) still redirects to `/admin/login` with a safe `?next=`.
- Security headers / CSP report-only behavior described in `docs/PRODUCTION_OPERATIONS.md`.
- Logs redact secrets and sensitive enquiry fields.

---

## Database & Schema

| Table | Role |
| --- | --- |
| `categories` | Catalog categories |
| `products` | Catalog; `is_active`, `featured_on_homepage`, `homepage_sort_order` |
| `site_settings` | Contact + services/testimonials section copy |
| `services` | Celebration services |
| `testimonials` | Homepage quotes |
| `blog_posts` | Journal |
| `enquiries` | Leads |
| `admin_users` | Auth + `session_version` |
| `admin_login_attempts` | Login + enquiry IP throttles |
| `admin_push_subscriptions` | Web Push endpoints |

- Source of truth for shape: `src/db/schema.ts` + `src/lib/schema-expectations.ts`.
- Production path: **`db:ensure`** (additive) + **`db:verify`** (read-only).
- **`db:migrate` unsafe** while `__drizzle_migrations` history lags physical schema (historically recorded early tags only on production even when columns exist). Do not fake journal rows casually.
- On-disk SQL: `0000`–`0009`; journal includes through `0008` and **skips orphan `0004`**; `0009` push SQL may be applied via ensure rather than migrate.
- Hostinger is typically **MariaDB**; JSON columns may appear as LONGTEXT + `JSON_VALID` — treated as compatible by verify.

See `docs/database.md`.

---

## Upload & Image Architecture

- Client: `fileToUploadPayload` (browser resize/compress before send).
- Server: MIME/magic-byte validation; Sharp WebP variants; write to persistent uploads root; optional mirror into bundle for local/prod serving.
- Read: multi-root resolve (`uploads-path`) via `/uploads/$`. Admin list thumbs (products, categories, services) use `OptimizedImage` + generated variants.
- Duplicate products: **file copy**, never shared destructive ownership.
- Bulk create: same upload validation pipeline as single save.
- Seed/build: `scripts/prepare-uploads.ts` copies seed assets into targets.

---

## Caching

- Process-local Map in `cache.server.ts`, default TTL **10s**.
- Used for public list/settings-style reads in `data.server.ts`.
- Product detail intentionally bypasses cache for visibility correctness.
- Admin mutations call `clearDataCache()` in the handling process.
- TanStack Router: intent preload stale **30s**. Loader `staleTime` is **Admin-route-specific** (15s shell/dashboard/products; 10s enquiries list) — not a global default. Product editor save and Bulk Add invalidate before returning to the products list. Not Infinity. Shell badge may refresh in the background and must not block child loaders.
- Not shared across Node workers; acceptable for single Hostinger process.

---

## PWA / Service Worker

| Asset | Role |
| --- | --- |
| `manifest.webmanifest` | Public install identity |
| `admin.webmanifest` | Admin install identity |
| `admin-push-sw.js` | Push + notificationclick (+ badge helpers); **no offline fetch cache** |

---

## Notifications

- Library: `web-push` + VAPID.
- Runtime public key: **derived from private key**.
- Env: `WEB_PUSH_VAPID_PRIVATE_KEY`, `WEB_PUSH_VAPID_SUBJECT` (normalized mailto/https). Legacy public env ignored for send/subscribe.
- Scripts: `generate:vapid-keys`, `validate:vapid-keys` (no secret printing in normal output).
- Triggers: new enquiry; Admin test button.

---

## SEO

- Route `head()` titles/descriptions/OG/Twitter; product titles use the real category.
- Single-category catalog URLs (`/catalog?category=hampers`, etc.) use category-specific server-rendered copy and canonicals. Valid pagination uses crawlable links and self-canonical URLs; empty, combined and out-of-range filters use `noindex, follow`.
- JSON-LD where implemented (e.g. website/product helpers and indexable catalog views).
- Admin route tree uses `noindex, nofollow`; authentication remains independent of indexing.
- Product and category editors offer optional SEO title/description overrides with a search-result preview. Blank fields retain generated defaults; clearing a saved override restores them. Overrides affect public SSR metadata and social previews, not slugs, indexing rules or category headings. New bulk/duplicated products start without overrides.
- Products and categories each store nullable `meta_title` and `meta_description`. Hostinger's existing additive `db:ensure` / `db:verify` workflow manages these columns; no data backfill is required.
- Dynamic sitemap + robots using `VITE_SITE_URL` / `siteUrl()`. Public crawling (including OAI-SearchBot) is allowed by the wildcard rule; hosting/CDN access must be verified separately.
- Public website, homepage Organization, products, services, contact and journal reference one business ID (`/#organization`). Business contact/social/location/founder values use the existing public site settings. Home FAQs share one source for visible copy and JSON-LD. Precise address, pin coordinates, price range, hours and ratings are not asserted in Organization JSON-LD without verification. No paid AI tracker is required for this implementation.

---

## Analytics

- Optional Google Analytics via `VITE_GA_ID` in `__root.tsx`.
- Client `trackEvent` helpers for selected CTAs.

---

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | MySQL (required production) |
| `ADMIN_SESSION_SECRET` | Cookie HMAC (≥32; required production) |
| `VITE_SITE_URL` | Canonical/public origin (required production) |
| `UPLOADS_DIR` | Persistent uploads (recommended on Hostinger) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seed only |
| `VITE_GA_ID` | Optional analytics |
| `WEB_PUSH_VAPID_PRIVATE_KEY` | Push (secret) |
| `WEB_PUSH_VAPID_SUBJECT` | Push subject |
| `WEB_PUSH_VAPID_PUBLIC_KEY` | Legacy optional; not runtime authority |
| `HOST` / `NITRO_HOST` | Bind (Hostinger often `0.0.0.0`) |
| `NODE_ENV` | production flags |

Never commit real secrets. Never document private VAPID material.

---

## Deployment / Hostinger

1. Backup DB + uploads.
2. hPanel env: `DATABASE_URL`, `ADMIN_SESSION_SECRET`, `VITE_SITE_URL`, uploads path, optional push.
3. Build command: **`npm run build`** (ensure → verify → `build:app`).
4. Entry: `dist/server/hostinger-entry.mjs` (stdin stub for LiteSpeed).
5. Smoke: `/`, `/catalog`, `/admin/login`, blog, representative image, `/health`.
6. Do not deploy macOS `node_modules`/Sharp binaries to Linux.

CI uses `build:app` without production DB. Details: `docs/PRODUCTION_OPERATIONS.md`.

---

## Testing & CI

| Command | What |
| --- | --- |
| `npm run test` | Vitest unit tests (`src/**/*.test.ts`) |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Types (local/CI discipline) |
| `npm run test:e2e` | Playwright Chromium + scoped WebKit |
| `npm run test:visual` | Opt-in Chromium screenshots (not default CI gate) |
| `npm run smoke` | Deployed-origin smoke script |

- WebKit/Playwright ≠ substitute for real iPhone/iPad Safari checks.
- E2E refuses non-local remote URLs and requires test/e2e DB naming.
- Admin login E2E fills `#password` (not `getByLabel("Password")`) so the “Show password” control is not matched.

GitHub Actions (`.github/workflows/ci.yml`): lint + Vitest + `build:app`; e2e job with MySQL service + seed + Playwright.

---

## Important Routes

**Public:** `/`, `/catalog`, `/catalog/$slug`, `/services`, `/blog`, `/blog/$slug`, `/contact`, `/custom`, `/sitemap.xml`, `/robots.txt`, `/health`, `/uploads/$`

**Admin:** `/admin/login`, `/admin`, `/admin/enquiries`, `/admin/enquiries/$enquiryId`, `/admin/products`, `/admin/products/bulk`, `/admin/products/$productId`, `/admin/categories`, `/admin/services`, `/admin/blog`, `/admin/blog/$postId`, `/admin/testimonials`, `/admin/settings`

---

## Important Modules

| Module | Role |
| --- | --- |
| `src/lib/data.server.ts` | Public catalog/settings reads + fallback |
| `src/lib/api/catalog.ts` / `api/admin/*` | Server functions |
| `src/lib/admin-enquiry-queries.server.ts` | Shared enquiry COUNT/summary queries for Admin page-data |
| `src/lib/admin-nav-load.ts` | Pure helpers: skip public root data on Admin; UI session check on enter only |
| `src/lib/auth.server.ts` | Sessions |
| `src/lib/uploads.server.ts` | Image save/copy/delete |
| `src/lib/admin-push.server.ts` | VAPID + send |
| `src/lib/enquiries.server.ts` | Public submit core |
| `src/lib/schema-expectations.ts` | ensure/verify model |
| `src/lib/admin-product-bulk.ts` / `product-slug.ts` | Bulk drafts + slugs |
| `src/lib/cache.server.ts` | TTL cache |
| `scripts/ensure-schema.ts` / `verify-schema.ts` | Deploy schema safety |
| `scripts/write-hostinger-entry.mjs` | Hostinger entry wrapper |

---

## Data Models / Tables

See Database & Schema. Product visibility: inactive products must not appear on public catalog/detail. Featured homepage products are a filtered subset with sort order.

---

## Operational Safety Rules

- Hostinger Build Command stays `npm run build`.
- Never routine-production `db:migrate` or `db:seed`.
- Persistent uploads must survive redeploy.
- Enquiry persistence before WhatsApp; push never blocks enquiry success.
- Do not share product image paths across independently deletable products.
- Bulk drafts stay hidden until explicitly made visible.
- Do not print or commit secrets.
- Prefer smallest change; reuse existing patterns.

---

## Known Technical Debt / Limitations

- Production Drizzle **migration history** may lag physical schema; ensure/verify is the supported path until a planned history reconciliation.
- `0004_add_product_is_active.sql` is an orphan (on disk, not in journal).
- `0009_add_admin_push_subscriptions.sql` exists for documentary/ensure use; journal currently ends at `0008`.
- In-memory cache is per-process only.
- Custom order form does not create Admin leads.
- Visual regression is opt-in and environment-sensitive.
- Real-device iOS validation remains necessary beyond WebKit e2e.
- Admin date display uses fixed `Asia/Kolkata` formatting to avoid SSR/client timezone hydration mismatches.

---

## Explicitly Deferred Features

- Checkout / payments / carts
- Customer accounts
- Full CRM / quoting engine
- CSV product import
- Instagram scraping / AI content generation
- Offline-first Admin caching SW
- Redis or shared cache invalidation
- Enforced CSP (currently report-oriented posture per ops doc)

---

## Documentation Map

| Doc | Use |
| --- | --- |
| `PROJECT_CONTEXT.md` | Canonical current-state (this file) |
| `README.md` | Install, env, Hostinger quickstart, command index |
| `docs/database.md` | ensure/verify/migrate policy + MariaDB JSON |
| `docs/PRODUCTION_OPERATIONS.md` | Deploy, push env, Playwright, performance notes |
| `docs/enquiries.md` | Lead capture + Admin workflow |
| `docs/BACKUP_AND_RESTORE.md` | Backup/restore procedures |
| `.cursor/rules/daintyhand-context.mdc` | AI workflow: selective doc reading + sync contract |
