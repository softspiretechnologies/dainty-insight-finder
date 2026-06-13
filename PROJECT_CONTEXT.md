# Project Overview

* **Project name:** DaintyHand (repo/package: `tanstack_start_ts`, Lovable project: `dainty-insight-finder`)
* **Framework and language:** TanStack Start (React 19 + TypeScript) with Vite 7, TanStack Router, TanStack Query, and Nitro for SSR/deployment
* **Main purpose:** A marketing and catalog website for **DaintyHand**, a Kerala-based handcrafted gifting and celebration studio founded by Nafisa. The site showcases past creations and celebration services, drives enquiries via WhatsApp/Instagram, and includes a **protected admin portal** for catalog management backed by **MySQL**. There is no checkout or customer accounts.

# Architecture

## Folder structure

```
dainty-insight-finder/
├── public/                  # Static assets (og-image.jpg, favicon.svg)
├── src/
│   ├── assets/              # Product/service images (imported by routes & data)
│   ├── components/
│   │   ├── site/            # App-specific layout (header, footer, shell, WhatsApp bot)
│   │   ├── admin/           # Admin portal layout (AdminShell)
│   │   └── ui/              # shadcn/ui primitives used by admin (7 components)
│   ├── data/
│   │   └── products.ts      # Static catalog fallback (when DATABASE_URL unset)
│   ├── db/
│   │   ├── schema.ts        # Drizzle MySQL tables
│   │   └── index.server.ts  # Connection pool
│   ├── lib/
│   │   ├── site.ts          # Brand/contact config + whatsappLink() + siteUrl()
│   │   ├── config.server.ts # Server-only env helpers
│   │   ├── utils.ts         # cn() Tailwind class merger
│   │   ├── cache.server.ts  # In-memory TTL cache for catalog reads
│   │   ├── data.server.ts   # getCategories/getProducts/getSiteSettings (+ fallback)
│   │   ├── auth.server.ts   # Admin session cookie + bcrypt
│   │   ├── uploads.server.ts # Image upload validation + disk storage
│   │   ├── api/
│   │   │   ├── catalog.ts   # Public catalog server functions (loaders)
│   │   │   └── admin/       # Admin auth, CRUD server functions
│   │   └── error-page.ts    # SSR error HTML fallback
│   ├── routes/              # File-based TanStack Start routes
│   ├── router.tsx           # Router factory
│   ├── server.ts            # Custom SSR entry (error wrapper)
│   ├── start.ts             # TanStack Start middleware config
│   ├── routeTree.gen.ts     # Auto-generated route tree (do not edit)
│   └── styles.css           # Tailwind v4 theme tokens & base styles
├── drizzle/migrations/      # SQL migrations (Drizzle Kit)
├── scripts/seed.ts          # Seed MySQL + copy images to public/uploads/
├── public/uploads/          # Runtime product/category images (gitignored except .gitkeep)
├── vite.config.ts           # Lovable TanStack config wrapper
├── components.json          # shadcn/ui config
├── package.json
├── package-lock.json
└── tsconfig.json            # Path alias: @/* → src/*
```

## Important modules

| Module | Role |
| --- | --- |
| `src/routes/` | All pages and the XML sitemap handler |
| `src/data/products.ts` | Static catalog fallback when `DATABASE_URL` is unset |
| `src/lib/data.server.ts` | Live catalog reads from MySQL with static fallback |
| `src/lib/site.ts` | Brand defaults, `whatsappLink()` and `siteUrl()` helpers |
| `src/routes/admin*.tsx` | Protected admin portal (login, products, categories, settings) |
| `src/components/site/PageShell.tsx` | Shared layout: header, main, footer, floating WhatsApp bot |
| `src/server.ts` + `src/start.ts` | SSR error handling middleware |
| `@lovable.dev/vite-tanstack-config` | Bundles Vite plugins (TanStack Start, Nitro, Tailwind, etc.) |

## Design patterns used

* **File-based routing** — TanStack Router; one `.tsx` file per route under `src/routes/`
* **Layout composition** — `PageShell` wraps page content; `catalog.tsx` is a layout route with `<Outlet />`
* **Route loaders** — Product detail (`catalog.$slug.tsx`) loads product data server-side and throws `notFound()` for invalid slugs
* **Per-route SEO** — Each route defines `head()` with title, description, OG/Twitter tags, canonical URLs, and JSON-LD where relevant
* **Route loaders** — Public catalog/homepage use `createServerFn` wrappers in `src/lib/api/catalog.ts` to avoid bundling MySQL into the client
* **Static data fallback** — `src/data/products.ts` used when `DATABASE_URL` is missing (local dev without MySQL)
* **Admin auth** — bcrypt password + signed httpOnly session cookie (`ADMIN_SESSION_SECRET`)
* **File uploads** — Product/category images uploaded via `FormData` server functions; stored under `public/uploads/`; no URL paste fields
* **URL search params** — Catalog uses TanStack Router `validateSearch` + `useNavigate` for `?category=` and `?page=` (bookmarkable, shareable)
* **Form validation** — Custom order form uses `react-hook-form` + `zodResolver` for client-side validation before opening WhatsApp
* **WhatsApp-as-CRM** — Custom order form and all CTAs build a pre-filled message and open `wa.me`
* **Server handlers** — `sitemap[.]xml.ts` and `robots[.]txt.ts` expose Nitro `GET` handlers for dynamic generation
* **Error boundaries** — Root `errorComponent` and `notFoundComponent` styled to match site theme; custom SSR error page; Lovable error reporting hook

# Features

## Major functionalities

1. **Home (`/`)** — Centered editorial hero, 8-category grid, Why DaintyHand feature strip, moments gallery, How It Works (dark section), credibility stats, gallery, testimonials, closing CTA
2. **Catalog (`/catalog`)** — Filter by 8 categories (`?category=`), paginated product grid (12/page, `?page=`), per-product WhatsApp enquire CTA
3. **Product detail (`/catalog/$slug`)** — Image, description, details list, customization options, WhatsApp CTA with prefilled product name
4. **Celebration services (`/services`)** — Save-the-date shoots, proposals, birthday surprises, couple shoots, memory reels; alternating two-column layout
5. **Custom order (`/custom`)** — Validated form (name, phone, email, service, event type/date, budget, location, notes) → opens WhatsApp with prefilled brief
6. **Contact (`/contact`)** — Hero, contact channel grid (WhatsApp highlighted), delivery & shipping strip, closing CTA
7. **Sitemap (`/sitemap.xml`)** — Auto-generated from static routes + all product slugs
8. **robots.txt (`/robots.txt`)** — Dynamically served via Nitro handler using `site.baseUrl`
9. **Floating WhatsApp bot** — Persistent chat widget on all pages; guided conversation tree (Browse, Custom Order, How It Works, Delivery Info) with pre-filled WhatsApp CTAs; categories from MySQL via root loader context
10. **Admin portal (`/admin`)** — Login, dashboard, products CRUD, categories editor, site settings. Images via file upload only.

## Removed pages

* **`/about`** (`src/routes/about.tsx`) — Deleted. "Our Story" removed from nav.

## Product categories (8)

`hampers`, `bouquets`, `invitations`, `engagement`, `frames`, `albums`, `calligraphy`, `celebrations`

## User roles

**Admin only (v1).** One admin user created by `npm run db:seed` from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Public visitors have no accounts.

# Database

**MySQL via Drizzle ORM** (`drizzle-orm` + `mysql2`). Migrations in `drizzle/migrations/`. Seed script: `scripts/seed.ts`.

| Table | Purpose |
| --- | --- |
| `categories` | 8 category slugs, labels, blurbs, `image_path`, sort order |
| `products` | Catalog items (slug, name, category, copy, details JSON, `image_path`, price) |
| `site_settings` | Single row: WhatsApp, email, Instagram, founder, location |
| `admin_users` | Admin login (email + bcrypt `password_hash`) |

**Fallback:** If `DATABASE_URL` is not set, `src/lib/data.server.ts` reads from `src/data/products.ts` and `src/lib/site.ts`.

| Concept | Live source | Fallback |
| --- | --- | --- |
| Products | MySQL `products` | `Product[]` in `src/data/products.ts` |
| Categories | MySQL `categories` | `categories[]` in same file |
| Gallery images | Static | `galleryImages[]` in same file (not in admin v1) |
| Site config | MySQL `site_settings` | `site` object in `src/lib/site.ts` |

Uploaded images live on disk at `public/uploads/` (paths like `/uploads/products/slug.jpg`).

# APIs and Integrations

## External services

| Service | Usage |
| --- | --- |
| **WhatsApp** (`wa.me`) | Primary order/enquiry channel; `whatsappLink()` in `src/lib/site.ts` |
| **Instagram** | Social link (`@dainty.handd`) in header, footer, contact |
| **Google Fonts** | Playfair Display, Inter, JetBrains Mono (loaded in `__root.tsx`) |
| **Lovable platform** | Hosting, error reporting (`window.__lovableEvents`), build config |
| **Cloudflare** (Assumed) | Nitro default deploy target per `vite.config.ts` comments |

## Authentication methods

**Admin session cookie** — `loginAdmin` server function verifies bcrypt hash, sets signed httpOnly cookie. Admin layout `beforeLoad` redirects unauthenticated users to `/admin/login`.

## Server functions

| Module | Purpose |
| --- | --- |
| `src/lib/api/catalog.ts` | Public data loaders (categories, products, site settings) |
| `src/lib/api/admin/auth.ts` | Login, logout, session check |
| `src/lib/api/admin/products.ts` | Admin product CRUD (JSON + base64 image upload) |
| `src/lib/api/admin/categories.ts` | Admin category save (JSON + base64 image upload) |
| `src/lib/api/admin/settings.ts` | Site settings CRUD |

## Environment variables

| Variable | Purpose |
| --- | --- |
| `VITE_SITE_URL` | Canonical base URL (client + server) |
| `DATABASE_URL` | MySQL connection string |
| `ADMIN_SESSION_SECRET` | Signs admin session cookie |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Used by `db:seed` to create/update admin user |
| `UPLOADS_DIR` | Persistent upload path (default on Hostinger: `../uploads` beside `nodejs/`) |

Server config pattern in `src/lib/config.server.ts` reads `process.env` inside functions.

# Development Commands

Package manager: **npm** (`package-lock.json`).

| Command | Purpose |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build (Vite + Nitro) |
| `npm run build:dev` | Development-mode build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier format all files |
| `npm run db:generate` | Generate Drizzle SQL migrations |
| `npm run db:migrate` | Apply migrations to MySQL |
| `npm run db:seed` | Seed DB + copy images to `public/uploads/` and persistent uploads dir |
| `npm run db:studio` | Drizzle Studio (optional) |

> If using npm and you hit peer dependency errors: `npm install --legacy-peer-deps`

**Tests:** No test runner or test scripts are configured (no Vitest, Jest, or Playwright).

# Important Files

| File | Purpose |
| --- | --- |
| `package.json` | Dependencies, scripts, project metadata |
| `vite.config.ts` | TanStack Start server entry override (`src/server.ts`) |
| `src/routes/__root.tsx` | HTML shell, global meta/OG, root catalog context, themed 404/error UI |
| `src/routes/index.tsx` | Homepage (hero, categories, why, moments, how-it-works, stats, gallery, testimonials, closing CTA) |
| `src/routes/catalog.index.tsx` | Catalog listing with URL search param filters & pagination |
| `src/routes/catalog.$slug.tsx` | Product detail with loader + JSON-LD |
| `src/routes/custom.tsx` | Custom order form with react-hook-form + Zod validation |
| `src/routes/services.tsx` | Celebration services page |
| `src/routes/contact.tsx` | Contact page (channels, delivery strip, closing CTA) |
| `src/routes/sitemap[.]xml.ts` | Dynamic XML sitemap server handler |
| `src/routes/robots[.]txt.ts` | Dynamic robots.txt server handler |
| `src/routes/admin.tsx` | Admin layout + auth guard |
| `src/routes/admin.login.tsx` | Admin login form |
| `src/routes/admin.products.tsx` | Products layout (`<Outlet />`) |
| `src/routes/admin.products.index.tsx` | Product list |
| `src/routes/admin.products.$productId.tsx` | Product add/edit with image upload |
| `src/routes/uploads/$.tsx` | Serves uploaded images from disk |
| `src/routes/admin.categories.tsx` | Category editor with file upload |
| `src/routes/admin.settings.tsx` | Site settings editor |
| `src/data/products.ts` | Static catalog fallback — prefer admin/MySQL in production |
| `src/lib/site.ts` | Brand defaults; live settings in MySQL `site_settings` |
| `src/components/site/PageShell.tsx` | Shared page layout |
| `src/components/site/SiteHeader.tsx` | Navigation (desktop + mobile sheet); no "Our Story" link |
| `src/components/site/SiteFooter.tsx` | Footer with brand name, Instagram, WhatsApp |
| `src/components/site/FloatingWhatsApp.tsx` | Guided chat bot widget (Browse / Custom / How It Works / Delivery) |
| `src/styles.css` | Design tokens (warm editorial palette) |
| `components.json` | shadcn/ui configuration (new-york style) |
| `src/routeTree.gen.ts` | Auto-generated — never edit manually |
| `public/og-image.jpg` | Default Open Graph image used across all pages |
| `public/favicon.svg` | SVG favicon ("D" in terracotta) |
| `.lovable/plan.md` | Original product requirements and scope |

# Coding Conventions

## Naming standards

* **Routes:** kebab-case filenames (`catalog.$slug.tsx`, `sitemap[.]xml.ts`); export `Route` via `createFileRoute()`
* **Components:** PascalCase (`PageShell`, `SiteHeader`); site components in `components/site/`, UI primitives in `components/ui/`
* **Data/types:** PascalCase types (`Product`, `Category`); camelCase fields (`priceFrom`, `slug`)
* **Server-only modules:** `.server.ts` suffix (e.g. `config.server.ts`) — prevents client bundling
* **Path alias:** `@/` maps to `src/` (e.g. `@/lib/site`, `@/data/products`)

## Folder organization

* **Do not** create `src/pages/` or Next.js-style layouts — use `src/routes/` only (see `src/routes/README.md`)
* **Site-specific components** go in `components/site/`; reusable UI in `components/ui/` (shadcn)
* **Static content** lives in `src/data/`; **brand config** in `src/lib/site.ts`
* **Images** imported from `src/assets/` as Vite static imports

## Styling

* Tailwind CSS v4 with custom `@theme` tokens in `styles.css`
* Typography: `font-display` (Playfair Display), `font-body` (Inter), `font-mono` (JetBrains Mono)
* Color palette: warm off-white background (`#fdfbf7`), terracotta primary (`#c17f6a`), dark foreground for section contrast
* Utility: `cn()` from `src/lib/utils.ts` for conditional class merging
* **Button style:** rounded-full pills (`rounded-full`) with `uppercase tracking-widest text-xs` — always use this pattern, never `rounded-md`
* **Section pattern:** alternate between `bg-background`, `bg-surface/40` (with `border-y border-border`), and `bg-foreground text-background` (dark) for visual rhythm

## Common helper functions

```ts
// src/lib/site.ts
whatsappLink(message?: string)  // Builds wa.me URL with optional encoded message
siteUrl(path?: string)           // Builds absolute URL from a path (uses VITE_SITE_URL or fallback)

// src/lib/utils.ts
cn(...inputs)                    // clsx + tailwind-merge

// src/lib/config.server.ts
getServerConfig()                // Server-only env reads (per-request) 
```

## Route conventions

* Each route file exports `Route = createFileRoute("...")({ ... })`
* Use `head()` for per-page SEO meta — always include `title`, `description`, `og:title`, `og:description`, `og:image` (use `siteUrl("/og-image.jpg")`), `og:url` (use `siteUrl("/path")`), and `canonical` link
* Use `loader` for data fetching (product detail)
* Use `component` for the page UI
* Layout routes render children via `<Outlet />`
* Catalog uses `validateSearch` with a Zod schema for `category` and `page` URL params

## SEO checklist for new routes

1. `title` — `"Page Name — DaintyHand"`
2. `description` — concise, keyword-aware
3. `og:title`, `og:description`, `og:image` (`siteUrl("/og-image.jpg")`), `og:url` (`siteUrl("/path")`)
4. `twitter:card: "summary_large_image"`, `twitter:image`
5. `canonical` link using `siteUrl("/path")`
6. JSON-LD if relevant (Product, Service, LocalBusiness)
7. Add path to `staticPaths` in `src/routes/sitemap[.]xml.ts`

# Notes for Future AI Sessions

1. **Catalog is MySQL-backed in production** — set `DATABASE_URL`, run `db:migrate` + `db:seed`. Static `products.ts` is fallback only.
2. **To add/edit products:** use `/admin/products` (file upload for images). Or edit `src/data/products.ts` for offline fallback.
3. **To update contact info:** use `/admin/settings` when DB is configured; otherwise edit `src/lib/site.ts`.
4. **Do not edit** `src/routeTree.gen.ts` — it regenerates from route files automatically.
5. **Do not add duplicate Vite plugins** in `vite.config.ts` — `@lovable.dev/vite-tanstack-config` already includes TanStack Start, React, Tailwind, Nitro, etc.
6. **Routing is TanStack Start**, not Next.js. Root layout is `src/routes/__root.tsx`; child routes need `<Outlet />` in parents.
7. **shadcn/ui is installed** but most pages use custom Tailwind markup; shadcn components (`Sheet`, `Button`, etc.) are used sparingly (e.g. mobile nav).
8. **SEO is a priority** — preserve `head()` meta, canonical URLs, JSON-LD, and `sitemap[.]xml.ts` when adding routes. Always use `siteUrl()` for absolute URLs in meta — never use local asset import paths directly.
9. **Deployment target** is Lovable/Cloudflare Workers (assumed from Nitro config). Use `.server.ts` for secrets; never `import.meta.env` for private keys.
10. **No tests exist** — add a test runner if testing is requested.
11. **Admin portal exists** at `/admin` — bcrypt auth, MySQL CRUD, file uploads to persistent `../uploads` (or `UPLOADS_DIR`). No customer accounts or checkout.
12. **Canonical base URL** configured via `VITE_SITE_URL` env var in `src/lib/site.ts`. Defaults to `https://dainty-insight-finder.lovable.app`. Update when deploying to a custom domain.
13. **`/about` page has been deleted** — do not recreate it. "Our Story" is removed from the nav.
14. **FloatingWhatsApp is a chat bot**, not a simple link button. It has a guided conversation tree (screens: home, browse, custom, howItWorks, delivery). Add new screens there for new topics. Screen resets to "home" only when the user explicitly closes (×), not when minimized.
15. **og:image for all pages** uses `public/og-image.jpg` (a copy of `service-hampers.jpg`). For per-product og:image, use the same fallback since bundled asset paths aren't valid public URLs for social crawlers.
16. **Form errors** use `text-destructive` (not `text-red-600`) to stay theme-consistent.
17. **Hostinger / Node deployment:** Entry file **`dist/server/hostinger-entry.mjs`**. Set `DATABASE_URL`, `ADMIN_SESSION_SECRET`, `VITE_SITE_URL`, and optionally `UPLOADS_DIR`. WhatsApp and contact details live in MySQL `site_settings` (editable in `/admin/settings`). See `README.md` for the full redeploy checklist.
