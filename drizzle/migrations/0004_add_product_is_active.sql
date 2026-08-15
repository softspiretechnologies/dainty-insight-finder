-- Orphaned handwritten migration. Not listed in meta/_journal.json.
-- Historically applied via scripts/ensure-schema.ts, not drizzle-kit migrate.
-- Do not add this tag to the journal: environments may already have is_active.
ALTER TABLE `products` ADD `is_active` boolean NOT NULL DEFAULT true;
