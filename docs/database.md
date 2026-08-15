# Database strategy

Production schema and Drizzle migration history are **not currently in sync**. Treat `db:ensure` + `db:verify` as the safe production path. Do **not** run `db:migrate` on production until the history is reconciled.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run db:ensure` | Idempotent additive reconciliation. Creates missing tables, columns, and unique indexes. Never drops, truncates, seeds, or resets passwords. |
| `npm run db:verify` | Read-only check that the live database matches the current app schema. Exit `0` if current, non-zero if outdated. |
| `npm run db:migrate` | Drizzle Kit migrator. **Not safe for production today.** |
| `npm run db:seed` | Explicit catalog/admin seed. **Never** part of routine production deploy. |
| `npm run build:app` | Vite/Nitro compile only. No database access. Used by GitHub CI. |
| `npm run build` | Hostinger Build Command. Runs `db:ensure` → `db:verify` → `build:app`. Stops if schema reconciliation or verification fails. |
| `npm run deploy:hostinger` | Alias of `npm run build`. Hostinger’s UI only exposes `npm run build`. |

## Why production drifted

1. Code that selected `admin_users.session_version` was deployed before that column existed.
2. Later schema work (`is_active`, homepage featured fields, `admin_login_attempts`, `blog_posts`) was added in the repo and sometimes applied with `ensure-schema` or phpMyAdmin, not always with `drizzle-kit migrate`.
3. Production `__drizzle_migrations` still records only the early migrations (`0000`–`0002`).
4. `session_version` was then added manually in phpMyAdmin so login worked, which moved the **physical** schema further ahead of the **recorded** Drizzle history.

Do not insert fake rows into `__drizzle_migrations` to paper over this.

## Migration journal

`drizzle/migrations/meta/_journal.json` lists:

`0000` → `0001` → `0002` → `0003` → `0005` → `0006` → `0007`

`0004_add_product_is_active.sql` exists on disk but is **not** in the journal. That file is a handwritten orphan. It was applied in environments via `ensure-schema`, not generated as a normal Drizzle snapshot migration. Adding it to the journal now would make `db:migrate` try `ADD is_active` on databases that already have the column.

Later SQL files (`0003`, `0005`–`0007`) are also handwritten (no matching `meta/000x_snapshot.json` except `0000`). The journal tags exist so Drizzle Kit can find those files; they were not produced by a clean `db:generate` chain.

## When `db:migrate` can become safe

Only after all of the following:

1. Production physical schema matches `src/db/schema.ts` (`db:verify` passes).
2. A MySQL backup exists.
3. Someone compares production `__drizzle_migrations` hashes/tags with the journal and documents the exact missing tags.
4. Either:
   - those tags are recorded **after** confirming the SQL would be a no-op, or
   - a fresh baseline is generated from the verified schema in a planned maintenance window.

Until then, Hostinger must keep using `npm run build` (ensure → verify → compile). Do not switch production to `db:migrate`.

## Hostinger deploy

Hostinger’s managed Node.js UI only exposes **`npm run build`**. Keep that as the Build Command. The script already runs schema reconciliation and verification before compiling:

```bash
npm run build
```

`DATABASE_URL` must be available at build time so ensure/verify can reach MySQL. GitHub CI compiles with `npm run build:app` and never uses production credentials.

### One-time production reconciliation

1. Export/backup the database.
2. Run the read-only checks in `docs/production-schema-checks.sql`.
3. Uncomment and run only the matching statements in `docs/production-schema-reconcile.sql` for objects that are actually missing.
4. Run `npm run db:verify`.
5. Deploy with Hostinger Build Command `npm run build`.
6. Smoke test `/`, `/catalog`, `/admin/login`, and Admin → Blog.

Never run `db:seed` as part of that sequence.

## MariaDB JSON columns (Hostinger)

Hostinger Web/Cloud MySQL is typically **MariaDB**. On MariaDB, the `JSON` type is an alias for `LONGTEXT` (often with a `CHECK (json_valid(...))` constraint). Schema inspection therefore reports:

- `products.details` as `longtext`
- `services.bullets` as `longtext`

even when those columns were created as `JSON`.

This repository’s `db:ensure` / `db:verify` detect MariaDB via `SELECT VERSION()` and treat MariaDB JSON aliases as compatible with expected `json` columns (preferring evidence of a `JSON_VALID` check). They do **not** emit `ALTER TABLE` to convert `LONGTEXT` to `JSON`.

Do **not** manually convert those columns in phpMyAdmin because of inspection output. Leaving MariaDB’s JSON/`LONGTEXT` representation in place is correct.

## Enquiries table

Lead capture uses an `enquiries` table (see `src/db/schema.ts`).

Production receives it through **`npm run build` → `db:ensure`**, which creates the table if missing. A documentary migration file `drizzle/migrations/0008_add_enquiries.sql` exists for fresh installs / history, but Hostinger must **not** rely on `db:migrate`.

Statuses (application-level): `new`, `contacted`, `quoted`, `confirmed`, `lost`.

Public visitors submit enquiries; only admins can list, change status, or edit internal notes. Admin notes are never exposed publicly.
