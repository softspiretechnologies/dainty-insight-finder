# Production operations

## Required deployment configuration

- `DATABASE_URL`: MySQL connection URL.
- `ADMIN_SESSION_SECRET`: random secret of at least 32 characters.
- `UPLOADS_DIR`: absolute path to the persistent, writable upload directory; optional to the parser for development compatibility, but required operationally for Hostinger persistence.
- `VITE_SITE_URL`: public HTTPS origin used for canonical and structured-data URLs.
- `VITE_GA_ID`: optional Google Analytics measurement ID.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: seed-time credentials only; do not keep them in the public build environment when they are no longer needed.

Production startup rejects missing `DATABASE_URL`, `ADMIN_SESSION_SECRET`, or `VITE_SITE_URL`. The health check at `/health` returns 200 only when MySQL and the upload directory are available; it returns 503 without revealing connection or path details otherwise.

## Deploy

1. Back up MySQL and the persistent upload directory.
2. Install dependencies on the same Linux platform that will run the application with `npm ci`. Sharp contains native components, so do not upload a macOS-built `node_modules` or server bundle to Linux.
3. Apply `drizzle/migrations/0007_add_blog_posts.sql` (or run the normal migration process).
4. Build with the production environment configured: `npm run build`.
5. Keep `UPLOADS_DIR` outside release directories and preserve its ownership across deployments.
6. Restart the Node application.
7. Run `SITE_URL=https://your-origin.example npm run smoke`.
8. Confirm an admin login, a representative image, `/sitemap.xml`, and a blog post manually.

## Headers and CSP

The application sends `nosniff`, a strict-origin referrer policy, a restrictive permissions policy, and HSTS only when the request is confirmed as HTTPS. CSP starts in report-only mode because TanStack Start emits required inline bootstrap and JSON-LD content. Review browser/reporting violations before enforcing it; `unsafe-eval` is not permitted.

## Browser tests

Playwright refuses remote targets and requires a database name containing `test` or `e2e`. CI provides an ephemeral MySQL service, seeds it, and runs Chromium. Never set its `DATABASE_URL` to the production database.

## Backups

See [BACKUP_AND_RESTORE.md](./BACKUP_AND_RESTORE.md). Configure off-host retention and test restores before treating the process as production-ready.
