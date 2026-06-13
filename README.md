# DaintyHand

Marketing and catalog website for **DaintyHand** — a Kerala-based handcrafted gifting and celebration studio. Built with TanStack Start, React 19, and Tailwind CSS.

The public site reads catalog data from **MySQL** (with a static fallback when `DATABASE_URL` is not set). Orders are still handled via WhatsApp.

## Prerequisites

- Node.js 22+ (or [Bun](https://bun.sh))
- npm, pnpm, or Bun
- MySQL 8+ (Hostinger database in production)

## Install

```bash
npm install
```

If `npm install` fails with a `nitro` peer dependency conflict, use:

```bash
npm install --legacy-peer-deps
```

Alternatively, with Bun:

```bash
bun install
```

## Environment variables

```env
# Public site URL (canonical, OG, sitemap)
VITE_SITE_URL=https://your-domain.com

# MySQL (required for admin + live catalog)
DATABASE_URL=mysql://user:password@localhost:3306/daintyhand

# Admin session signing (long random string)
ADMIN_SESSION_SECRET=your-long-random-secret

# Used once by db:seed to create the admin user
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=choose-a-strong-password

# Optional: override upload directory (default: public/uploads)
# UPLOADS_DIR=/path/to/uploads
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
| Entry file | `dist/server/index.mjs` |
| Node version | 22.x |

**First-time deploy steps:**

1. Create a MySQL database and user in hPanel → **Databases**
2. Add environment variables: `DATABASE_URL`, `ADMIN_SESSION_SECRET`, `VITE_SITE_URL`, plus `ADMIN_EMAIL` / `ADMIN_PASSWORD` for seeding
3. Run `npm run db:migrate` and `npm run db:seed` once (SSH terminal or locally against the remote DB)
4. Deploy / redeploy the app

Uploaded product and category images are stored in `public/uploads/` on the server. Ensure this folder is not wiped on redeploy, or set `UPLOADS_DIR` to a persistent path.

## Admin portal

| Path | Purpose |
| --- | --- |
| `/admin/login` | Admin sign-in |
| `/admin` | Dashboard |
| `/admin/products` | Product list + add/edit/delete |
| `/admin/categories` | Edit category labels, blurbs, images |
| `/admin/settings` | WhatsApp, email, Instagram, founder, location |

Product and category images use **file upload only** (no URL paste). Images are saved to `public/uploads/` and served as static files.

## Other commands

```bash
npm run lint      # ESLint
npm run format    # Prettier
```

## Configuration

| What | Where |
| --- | --- |
| WhatsApp number, email, brand copy (fallback) | `src/lib/site.ts` |
| Live site settings | MySQL `site_settings` table (editable in `/admin/settings`) |
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
