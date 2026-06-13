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

## Database setup

```bash
# Generate migrations from schema (after schema changes)
npm run db:generate

# Apply migrations to MySQL
npm run db:migrate

# Seed categories, products, site settings, admin user + copy images to public/uploads/
npm run db:seed
```

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

| Hostinger setting | Value |
| --- | --- |
| Framework preset | **React Router** |
| Build command | `npm run build` |
| Output directory | `dist` |
| Entry file | `dist/server/hostinger-entry.mjs` |
| Node version | 22.x |

**First-time deploy steps:**

1. Create a MySQL database and user in hPanel → **Databases**
2. Add environment variables: `DATABASE_URL`, `ADMIN_SESSION_SECRET`, `VITE_SITE_URL`, plus `ADMIN_EMAIL` / `ADMIN_PASSWORD` for seeding
3. Run `npm run db:migrate` and `npm run db:seed` once (SSH terminal or locally against the remote DB)
4. Deploy / redeploy the app

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

| Location | Purpose |
| --- | --- |
| `public/uploads/` | Bundled seed images at build time |
| `../uploads/` or `UPLOADS_DIR` | Persistent runtime uploads (survives redeploy) |

`npm run build` copies seed images to both locations. New admin uploads always go to the persistent folder.

### Redeploy checklist

1. Push latest code to the Hostinger Git repo (or upload)
2. Confirm all env vars above are set in hPanel
3. Click **Save and redeploy** and wait for the build to finish
4. Verify: homepage loads, `/catalog` images work, `/admin/login` works
5. Confirm WhatsApp in **Admin → Settings** matches Nafisa's number
6. Upload a test product image in admin, redeploy again, confirm the image still loads

**Migrate/seed from your Mac** (not on the server — the deployed `nodejs` folder has no source):

```bash
# Terminal 1: SSH tunnel (keep open)
ssh -p 65002 -L 3307:127.0.0.1:3306 u249731825@93.127.208.157

# Terminal 2: from project root
DATABASE_URL=mysql://USER:PASSWORD@127.0.0.1:3307/DATABASE npm run db:migrate
npm run db:seed
```

Re-running `db:seed` preserves the WhatsApp number already saved in admin settings.

## Admin portal

| Path | Purpose |
| --- | --- |
| `/admin/login` | Admin sign-in |
| `/admin` | Dashboard |
| `/admin/products` | Product list + add/edit/delete |
| `/admin/categories` | Edit category labels, blurbs, images |
| `/admin/settings` | WhatsApp, email, Instagram, founder, location |

Product and category images use **file upload only** (no URL paste). Images are saved to the persistent uploads folder and served at `/uploads/*`.

## Other commands

```bash
npm run lint      # ESLint
npm run format    # Prettier
```

## Configuration

| What | Where |
| --- | --- |
| WhatsApp & contact details | MySQL `site_settings` via `/admin/settings` |
| Products & categories (fallback) | `src/data/products.ts` |
| Live catalog | MySQL via `src/lib/data.server.ts` |
| Site URL (canonical, OG, sitemap) | `VITE_SITE_URL` env var |

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

| Path | Page |
| --- | --- |
| `/` | Home |
| `/catalog` | Product catalog (supports `?category=` and `?page=` query params) |
| `/catalog/:slug` | Product detail |
| `/services` | Celebration services |
| `/custom` | Custom order form → WhatsApp |
| `/contact` | Contact & delivery info |
| `/sitemap.xml` | Dynamic sitemap |
| `/robots.txt` | Dynamic robots.txt |
