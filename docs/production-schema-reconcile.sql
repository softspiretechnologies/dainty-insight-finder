-- Additive-only fixes. Run AFTER a backup and AFTER production-schema-checks.sql.
-- Uncomment ONLY the statements whose matching check returned empty.
-- Do not run this file all at once if some objects already exist.
-- Do not edit __drizzle_migrations here.

-- If session_version is missing:
-- ALTER TABLE `admin_users` ADD `session_version` int NOT NULL DEFAULT 0;

-- If products.is_active is missing:
-- ALTER TABLE `products` ADD `is_active` boolean NOT NULL DEFAULT true;

-- If products.featured_on_homepage is missing:
-- ALTER TABLE `products` ADD `featured_on_homepage` boolean NOT NULL DEFAULT false;

-- If products.homepage_sort_order is missing:
-- ALTER TABLE `products` ADD `homepage_sort_order` int NOT NULL DEFAULT 0;

-- If site_settings.services_intro is missing:
-- ALTER TABLE `site_settings` ADD `services_intro` text NOT NULL DEFAULT ('');

-- If site_settings.services_footer_title is missing:
-- ALTER TABLE `site_settings` ADD `services_footer_title` varchar(256) NOT NULL DEFAULT ('');

-- If site_settings.services_footer_blurb is missing:
-- ALTER TABLE `site_settings` ADD `services_footer_blurb` text NOT NULL DEFAULT ('');

-- If site_settings.testimonials_heading is missing:
-- ALTER TABLE `site_settings` ADD `testimonials_heading` varchar(256) NOT NULL DEFAULT ('');

-- If admin_login_attempts is missing:
-- CREATE TABLE IF NOT EXISTS `admin_login_attempts` (
--   `id` int AUTO_INCREMENT NOT NULL,
--   `scope` varchar(16) NOT NULL,
--   `attempt_key` varchar(320) NOT NULL,
--   `failure_count` int NOT NULL DEFAULT 0,
--   `window_started_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   `locked_until` timestamp NULL,
--   `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--   CONSTRAINT `admin_login_attempts_id` PRIMARY KEY (`id`),
--   CONSTRAINT `admin_login_attempts_scope_key` UNIQUE (`scope`, `attempt_key`)
-- );

-- If blog_posts is missing:
-- CREATE TABLE IF NOT EXISTS `blog_posts` (
--   `id` int AUTO_INCREMENT NOT NULL,
--   `title` varchar(256) NOT NULL,
--   `slug` varchar(160) NOT NULL,
--   `excerpt` text NOT NULL,
--   `content` text NOT NULL,
--   `featured_image` varchar(512),
--   `meta_title` varchar(256),
--   `meta_description` text,
--   `is_published` boolean NOT NULL DEFAULT false,
--   `published_at` timestamp NULL,
--   `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--   CONSTRAINT `blog_posts_id` PRIMARY KEY (`id`),
--   CONSTRAINT `blog_posts_slug_unique` UNIQUE (`slug`)
-- );

-- If services is missing:
-- CREATE TABLE IF NOT EXISTS `services` (
--   `id` varchar(64) NOT NULL,
--   `title` varchar(256) NOT NULL,
--   `blurb` text NOT NULL,
--   `bullets` json NOT NULL,
--   `image_path` varchar(512) NOT NULL DEFAULT '',
--   `sort_order` int NOT NULL DEFAULT 0,
--   CONSTRAINT `services_id` PRIMARY KEY (`id`)
-- );

-- If testimonials is missing:
-- CREATE TABLE IF NOT EXISTS `testimonials` (
--   `id` int AUTO_INCREMENT NOT NULL,
--   `quote` text NOT NULL,
--   `customer_name` varchar(128) NOT NULL,
--   `location` varchar(128) NOT NULL,
--   `context` varchar(128) NOT NULL,
--   `sort_order` int NOT NULL DEFAULT 0,
--   CONSTRAINT `testimonials_id` PRIMARY KEY (`id`)
-- );

-- If enquiries is missing:
-- CREATE TABLE IF NOT EXISTS `enquiries` (
--   `id` int AUTO_INCREMENT NOT NULL,
--   `name` varchar(128) NOT NULL,
--   `phone` varchar(32) NOT NULL,
--   `email` varchar(256),
--   `event_type` varchar(128),
--   `event_date` varchar(32),
--   `budget` varchar(128),
--   `message` text NOT NULL,
--   `source` varchar(32) NOT NULL DEFAULT 'general',
--   `product_id` int,
--   `product_name_snapshot` varchar(256),
--   `service_id` varchar(64),
--   `service_title_snapshot` varchar(256),
--   `status` varchar(32) NOT NULL DEFAULT 'new',
--   `admin_notes` text,
--   `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--   CONSTRAINT `enquiries_id` PRIMARY KEY (`id`)
-- );
