# DaintyHand

Marketing and catalog website for **DaintyHand** — a Kerala-based handcrafted gifting and celebration studio. Built with TanStack Start, React 19, and Tailwind CSS.

The public site reads catalog data from **MySQL** (with a static fallback when `DATABASE_URL` is not set). Orders are still handled via WhatsApp.

## Prerequisites

- Node.js 22+
- npm
- MySQL 8+ (Hostinger database in production)

## Install

```bash
npm install
```

If `npm install` fails with a `nitro` peer dependency conflict, use:

```bash
npm install --legacy-peer-deps
```

## Environment variables

```env
# Public site URL (canonical, OG, sitemap)
VITE_SITE_URL=https://your-domain.com

# MySQL (required for admin + live catalog)
DATABASE_URL=mysql://user:password@localhost:3306/daintyhand

# Admin session signing (long random string)
ADMIN_SESSION_SECRET=your-long-random-secret

# Used by db:seed to create the admin user
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=choose-a-strong-password

# Optional: persistent upload directory (recommended on Hostinger)
# Default on Hostinger: ../uploads next to the nodejs app folder
# UPLOADS_DIR=/home/u249731825/domains/dainty-hand.softspiretechnologies.com/uploads
```

Without `DATABASE_URL`, the site falls back to static data in `src/data/products.ts` and admin login will not work.

**Local vs production:** Use a local MySQL database in `.env` for development. Set production `DATABASE_URL` only in Hostinger hPanel — never in your local `.env`.

## Database setup

```bash
# Safe additive reconciliation (creates only missing tables/columns/uniques)
npm run db:ensure

# Read-only check that the database matches the current app schema
npm run db:verify

# Explicit initial/sample data — never part of routine production deploy
npm run db:seed
```

`npm run db:migrate` is the Drizzle Kit migrator. **Do not run it on production** until migration history is reconciled. See `docs/database.md`.

Optional: `npm run db:studio` opens Drizzle Studio.

## Development

```bash
npm run dev
```

Opens the Vite dev server (default port `8080`).

## Build

```bash
npm run build
npm run start     # run production server (Nitro node-server)
npm run preview   # preview production build locally
```

## Deploy on Hostinger (Node.js)

The production build uses **Nitro `node-server`** and outputs to `dist/`.

| Hostinger setting | Value                             |
| ----------------- | --------------------------------- |
| Framework preset  | **React Router**                  |
| Build command     | `npm run deploy:hostinger`        |
| Output directory  | `dist`                            |
| Entry file        | `dist/server/hostinger-entry.mjs` |
| Node version      | 22.x                              |

**First-time deploy steps:**

1. Create a MySQL database and user in hPanel → **Databases**
2. Add environment variables: `DATABASE_URL`, `ADMIN_SESSION_SECRET`, `VITE_SITE_URL`, plus `ADMIN_EMAIL` / `ADMIN_PASSWORD` for seeding
3. Export/backup the MySQL database
4. Confirm `DATABASE_URL` is available to the Hostinger build
5. Deploy with build command `npm run deploy:hostinger` (`db:ensure` → `db:verify` → `build`)
6. Smoke test homepage, catalog, `/admin/login`, and Admin → Blog

Do **not** run `npm run db:seed` during routine deploys. Seed only for a brand-new empty database, as an explicit admin step.

### hPanel environment variables (production)

Set these in **Websites → your site → Environment variables**, then **Save and redeploy**:

```env
VITE_SITE_URL=https://dainty-hand.softspiretechnologies.com
HOST=0.0.0.0
NITRO_HOST=0.0.0.0
DATABASE_URL=mysql://USER:PASSWORD@127.0.0.1:3306/DATABASE
ADMIN_SESSION_SECRET=<long random string>
ADMIN_EMAIL=admin@daintyhand.in
ADMIN_PASSWORD=<strong password>
UPLOADS_DIR=/home/u249731825/domains/dainty-hand.softspiretechnologies.com/uploads
```

Set WhatsApp and other contact details in **Admin → Settings** (`/admin/settings`). The public site reads them from MySQL.

`UPLOADS_DIR` is optional — the app defaults to `../uploads` beside the `nodejs` folder on Hostinger. Setting it explicitly is recommended.

### Persistent uploads

Admin uploads are saved **outside** `dist/` so redeploys do not wipe them:

| Location                       | Purpose                                        |
| ------------------------------ | ---------------------------------------------- |
| `public/uploads/`              | Bundled seed images at build time              |
| `../uploads/` or `UPLOADS_DIR` | Persistent runtime uploads (survives redeploy) |

`npm run build` copies seed images to both locations. New admin uploads always go to the persistent folder.

### Redeploy checklist

1. Export/backup the production database
2. Push latest code
3. Confirm env vars in hPanel, including `DATABASE_URL` at build time
4. Build with `npm run deploy:hostinger` and wait for `Database schema verified.`
5. Smoke test: homepage, `/catalog`, `/admin/login`, Admin → Blog
6. Confirm WhatsApp in **Admin → Settings**

If ensure/verify fail, the deploy stops. Fix schema first; do not switch the build command back to plain `npm run build`.

One-time production checks and commented additive SQL: `docs/production-schema-checks.sql` and `docs/production-schema-reconcile.sql`. Full strategy: `docs/database.md`.

Local development uses its own MySQL database via `.env` — keep `DATABASE_URL` pointed at `localhost`, not the production server.

## Admin portal

| Path                | Purpose                                       |
| ------------------- | --------------------------------------------- |
| `/admin/login`      | Admin sign-in                                 |
| `/admin`            | Dashboard                                     |
| `/admin/products`   | Product list + add/edit/delete                |
| `/admin/categories` | Edit category labels, blurbs, images          |
| `/admin/settings`   | WhatsApp, email, Instagram, founder, location |

Product and category images use **file upload only** (no URL paste). Images are saved to the persistent uploads folder and served at `/uploads/*`.

## Other commands

```bash
npm run lint              # ESLint
npm run format            # Prettier
npm run db:ensure         # additive schema reconciliation
npm run db:verify         # read-only schema check
npm run deploy:hostinger  # ensure + verify + build
```

## Configuration

| What                              | Where                                       |
| --------------------------------- | ------------------------------------------- |
| WhatsApp & contact details        | MySQL `site_settings` via `/admin/settings` |
| Products & categories (fallback)  | `src/data/products.ts`                      |
| Live catalog                      | MySQL via `src/lib/data.server.ts`          |
| Site URL (canonical, OG, sitemap) | `VITE_SITE_URL` env var                     |

## Project structure

- `src/routes/` — file-based pages (TanStack Router)
- `src/routes/admin*.tsx` — protected admin portal
- `src/components/site/` — public layout (header, footer, shell)
- `src/components/admin/` — admin layout shell
- `src/db/` — Drizzle schema and MySQL connection
- `src/lib/api/admin/` — admin server functions (auth, CRUD, uploads)
- `src/data/products.ts` — static catalog fallback
- `public/uploads/` — runtime product/category images
- `drizzle/migrations/` — SQL migrations
- `scripts/seed.ts` — initial data migration

See `PROJECT_CONTEXT.md` for a full architecture overview.

## Public routes

| Path             | Page                                                              |
| ---------------- | ----------------------------------------------------------------- |
| `/`              | Home                                                              |
| `/catalog`       | Product catalog (supports `?category=` and `?page=` query params) |
| `/catalog/:slug` | Product detail                                                    |
| `/services`      | Celebration services                                              |
| `/custom`        | Custom order form → WhatsApp                                      |
| `/contact`       | Contact & delivery info                                           |
| `/sitemap.xml`   | Dynamic sitemap                                                   |
| `/robots.txt`    | Dynamic robots.txt                                                |
