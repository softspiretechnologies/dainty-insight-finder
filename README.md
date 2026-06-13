# DaintyHand

Marketing and catalog website for **DaintyHand** — a Kerala-based handcrafted gifting and celebration studio. Built with TanStack Start, React 19, and Tailwind CSS.

Orders are handled via WhatsApp; there is no checkout or database.

## Prerequisites

- Node.js 20+ (or [Bun](https://bun.sh))
- npm, pnpm, or Bun

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

## Development

```bash
npm run dev
```

Opens the Vite dev server (default port `8080`).

## Build

```bash
npm run build
npm run preview   # preview production build locally
```

## Other commands

```bash
npm run lint      # ESLint
npm run format    # Prettier
```

## Configuration

| What | Where |
| --- | --- |
| WhatsApp number, email, brand copy | `src/lib/site.ts` |
| Products & categories | `src/data/products.ts` |
| Site URL (canonical, OG, sitemap) | `VITE_SITE_URL` env var or `site.baseUrl` in `src/lib/site.ts` |

Example `.env`:

```env
VITE_SITE_URL=https://your-domain.com
```

## Project structure

- `src/routes/` — file-based pages (TanStack Router)
- `src/components/site/` — layout (header, footer, shell)
- `src/data/products.ts` — static catalog data
- `public/` — static assets (`favicon.svg`, `og-image.jpg`)

See `PROJECT_CONTEXT.md` for a full architecture overview.

## Routes

| Path | Page |
| --- | --- |
| `/` | Home |
| `/catalog` | Product catalog (supports `?category=` and `?page=` query params) |
| `/catalog/:slug` | Product detail |
| `/services` | Celebration services |
| `/custom` | Custom order form → WhatsApp |
| `/about` | Founder story |
| `/contact` | Contact & map |
| `/sitemap.xml` | Dynamic sitemap |
| `/robots.txt` | Dynamic robots.txt |
