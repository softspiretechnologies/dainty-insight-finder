# Project Overview

* **Project name:** DaintyHand (repo/package: `tanstack_start_ts`, Lovable project: `dainty-insight-finder`)
* **Framework and language:** TanStack Start (React 19 + TypeScript) with Vite 7, TanStack Router, TanStack Query, and Nitro for SSR/deployment
* **Main purpose:** A marketing and catalog website for **DaintyHand**, a Kerala-based handcrafted gifting and celebration studio founded by Nafisa. The site showcases past creations and celebration services, drives enquiries via WhatsApp/Instagram, and has **no checkout, database, or user accounts**.

# Architecture

## Folder structure

```
dainty-insight-finder/
├── public/                  # Static assets (robots.txt, llms.txt)
├── src/
│   ├── assets/              # Product/service images (imported by routes & data)
│   ├── components/
│   │   ├── site/            # App-specific layout (header, footer, shell, WhatsApp)
│   │   └── ui/              # shadcn/ui primitives (Radix + Tailwind)
│   ├── data/
│   │   └── products.ts      # Static catalog data (categories, products, gallery)
│   ├── hooks/
│   │   └── use-mobile.tsx   # Responsive breakpoint hook
│   ├── lib/
│   │   ├── site.ts          # Brand/contact config + whatsappLink()
│   │   ├── config.server.ts # Server-only env helpers
│   │   ├── utils.ts         # cn() Tailwind class merger
│   │   ├── api/             # Example createServerFn (unused in app)
│   │   └── error-*.ts       # SSR error capture & reporting
│   ├── routes/              # File-based TanStack Start routes
│   ├── router.tsx           # Router factory with QueryClient
│   ├── server.ts            # Custom SSR entry (error wrapper)
│   ├── start.ts             # TanStack Start middleware config
│   ├── routeTree.gen.ts     # Auto-generated route tree (do not edit)
│   └── styles.css           # Tailwind v4 theme tokens & base styles
├── .lovable/                # Lovable platform metadata & plan
├── vite.config.ts           # Lovable TanStack config wrapper
├── components.json          # shadcn/ui config
├── package.json
├── bun.lock / bunfig.toml   # Bun package manager
└── tsconfig.json            # Path alias: @/* → src/*
```

## Important modules

| Module | Role |
| --- | --- |
| `src/routes/` | All pages and the XML sitemap handler |
| `src/data/products.ts` | Single source of truth for catalog content |
| `src/lib/site.ts` | Brand name, contact info, `whatsappLink()` helper |
| `src/components/site/PageShell.tsx` | Shared layout: header, main, footer, floating WhatsApp |
| `src/server.ts` + `src/start.ts` | SSR error handling middleware |
| `@lovable.dev/vite-tanstack-config` | Bundles Vite plugins (TanStack Start, Nitro, Tailwind, etc.) |

## Design patterns used

* **File-based routing** — TanStack Router; one `.tsx` file per route under `src/routes/`
* **Layout composition** — `PageShell` wraps page content; `catalog.tsx` is a layout route with `<Outlet />`
* **Route loaders** — Product detail (`catalog.$slug.tsx`) loads product data server-side and throws `notFound()` for invalid slugs
* **Per-route SEO** — Each route defines `head()` with title, description, OG/Twitter tags, canonical URLs, and JSON-LD where relevant
* **Static data layer** — No API or ORM; products are a typed TypeScript array
* **Client-side filtering** — Catalog category chips and pagination are React `useState` (no server queries)
* **WhatsApp-as-CRM** — Custom order form builds a message and opens `wa.me` (no backend submission)
* **Server handlers** — `sitemap[.]xml.ts` exposes a Nitro `GET` handler for dynamic sitemap generation
* **Error boundaries** — Root `errorComponent`, custom SSR error page, and Lovable error reporting hook

# Features

## Major functionalities

1. **Home (`/`)** — Hero, 8-category grid, moments gallery, how-it-works, credibility stats, testimonials, SEO keyword strip, founder strip
2. **Catalog (`/catalog`)** — Filter by 8 categories, paginated product grid (12/page), per-product WhatsApp enquire CTA
3. **Product detail (`/catalog/$slug`)** — Image, description, details list, customization options, WhatsApp CTA with prefilled product name
4. **Celebration services (`/services`)** — Save-the-date shoots, proposals, birthday surprises, couple shoots, memory reels
5. **Custom order (`/custom`)** — Form (name, phone, email, service, event type/date, budget, location, notes) → opens WhatsApp with prefilled brief
6. **About (`/about`)** — Founder story and studio background
7. **Contact (`/contact`)** — WhatsApp, Instagram, email, location, hours
8. **Sitemap (`/sitemap.xml`)** — Auto-generated from static routes + all product slugs
9. **Floating WhatsApp button** — Persistent CTA on all pages via `PageShell`

## Product categories (8)

`hampers`, `bouquets`, `invitations`, `engagement`, `frames`, `albums`, `calligraphy`, `celebrations`

## User roles

**None.** This is a public marketing site with no authentication, admin panel, or user accounts. Product updates are done by editing `src/data/products.ts` directly.

# Database

**No database.** There are no migrations, models, ORM, or persistent storage.

| Concept | Implementation |
| --- | --- |
| Products | `Product[]` in `src/data/products.ts` |
| Categories | `Category` union type + `categories[]` in same file |
| Gallery images | `galleryImages[]` in same file |
| Site config | `site` object in `src/lib/site.ts` |

Relationships are implicit: each `Product` has a `category: Category` field referencing the category union.

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

**None.** No login, sessions, JWT, or OAuth.

## Server functions

`src/lib/api/example.functions.ts` contains a demo `createServerFn` (`getGreeting`) — **not used by any route**. Pattern is available for future server logic.

## Environment variables

No `.env` files in the repo. Server config pattern in `src/lib/config.server.ts` reads `process.env` inside functions (required for Cloudflare Workers). Public client config would use `import.meta.env.VITE_*`.

# Development Commands

Package manager: **Bun** (lockfile present; npm/yarn also work via `package.json` scripts).

| Command | Purpose |
| --- | --- |
| `bun install` | Install dependencies |
| `bun run dev` | Start Vite dev server |
| `bun run build` | Production build (Vite + Nitro) |
| `bun run build:dev` | Development-mode build |
| `bun run preview` | Preview production build locally |
| `bun run lint` | ESLint check |
| `bun run format` | Prettier format all files |

**Tests:** No test runner or test scripts are configured (no Vitest, Jest, or Playwright).

# Important Files

| File | Purpose |
| --- | --- |
| `package.json` | Dependencies, scripts, project metadata |
| `vite.config.ts` | TanStack Start server entry override (`src/server.ts`) |
| `src/routes/__root.tsx` | HTML shell, global meta/OG, QueryClient provider, 404/error UI |
| `src/routes/index.tsx` | Homepage |
| `src/routes/catalog.index.tsx` | Catalog listing with filters & pagination |
| `src/routes/catalog.$slug.tsx` | Product detail with loader + JSON-LD |
| `src/routes/custom.tsx` | Custom order WhatsApp form |
| `src/routes/services.tsx` | Celebration services page |
| `src/routes/about.tsx` | About page |
| `src/routes/contact.tsx` | Contact page |
| `src/routes/sitemap[.]xml.ts` | Dynamic XML sitemap server handler |
| `src/data/products.ts` | **Edit this to add/update products and categories** |
| `src/lib/site.ts` | **Edit WhatsApp number, email, brand copy here** |
| `src/components/site/PageShell.tsx` | Shared page layout |
| `src/components/site/SiteHeader.tsx` | Navigation (desktop + mobile sheet) |
| `src/components/site/SiteFooter.tsx` | Footer links and social |
| `src/components/site/FloatingWhatsApp.tsx` | Fixed WhatsApp CTA |
| `src/styles.css` | Design tokens (warm editorial palette) |
| `components.json` | shadcn/ui configuration (new-york style) |
| `src/routeTree.gen.ts` | Auto-generated — never edit manually |
| `.lovable/plan.md` | Original product requirements and scope |
| `public/llms.txt` | LLM-readable site summary |

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
* Typography: `font-display` (Playfair), `font-body` (Inter), `font-mono` (JetBrains Mono)
* Color palette: warm off-white background (`#fdfbf7`), terracotta primary (`#c17f6a`)
* Utility: `cn()` from `src/lib/utils.ts` for conditional class merging

## Common helper functions

```ts
// src/lib/site.ts
whatsappLink(message?: string)  // Builds wa.me URL with optional encoded message

// src/lib/utils.ts
cn(...inputs)                    // clsx + tailwind-merge

// src/lib/config.server.ts
getServerConfig()                // Server-only env reads (per-request)
```

## Route conventions

* Each route file exports `Route = createFileRoute("...")({ ... })`
* Use `head()` for per-page SEO meta
* Use `loader` for data fetching (product detail)
* Use `component` for the page UI
* Layout routes render children via `<Outlet />`

# Notes for Future AI Sessions

1. **This is a static catalog site** — no database, auth, payments, or cart. Orders flow through WhatsApp only.
2. **To add/edit products:** modify `src/data/products.ts` (22 products as of analysis). Ensure unique `slug` values.
3. **To update contact info:** edit `src/lib/site.ts`. WhatsApp number is currently a placeholder (`919999999999`) with a `TODO` comment.
4. **Do not edit** `src/routeTree.gen.ts` — it regenerates from route files automatically.
5. **Do not add duplicate Vite plugins** in `vite.config.ts` — `@lovable.dev/vite-tanstack-config` already includes TanStack Start, React, Tailwind, Nitro, etc.
6. **Routing is TanStack Start**, not Next.js. Root layout is `src/routes/__root.tsx`; child routes need `<Outlet />` in parents.
7. **shadcn/ui is installed** but most pages use custom Tailwind markup; shadcn components (`Sheet`, `Button`, etc.) are used sparingly (e.g. mobile nav).
8. **SEO is a priority** — preserve `head()` meta, canonical URLs, JSON-LD, and `sitemap[.]xml.ts` when adding routes.
9. **Deployment target** is Lovable/Cloudflare Workers (Assumed from Nitro config comments). Use `.server.ts` for secrets; never `import.meta.env` for private keys.
10. **No tests exist** — add a test runner if testing is requested.
11. **Out of scope (v1):** checkout, admin panel, Instagram feed embed, order tracking/CRM.
12. **Canonical base URL** used in meta/sitemap: `https://dainty-insight-finder.lovable.app` — update if deploying to a custom domain.
