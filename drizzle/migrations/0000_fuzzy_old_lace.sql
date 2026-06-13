CREATE TABLE `admin_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(256) NOT NULL,
	`password_hash` varchar(256) NOT NULL,
	`name` varchar(128) NOT NULL,
	CONSTRAINT `admin_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` varchar(32) NOT NULL,
	`label` varchar(128) NOT NULL,
	`blurb` text NOT NULL,
	`image_path` varchar(512) NOT NULL DEFAULT '',
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(128) NOT NULL,
	`name` varchar(256) NOT NULL,
	`category_id` varchar(32) NOT NULL,
	`blurb` text NOT NULL,
	`description` text NOT NULL,
	`details` json NOT NULL,
	`image_path` varchar(512) NOT NULL DEFAULT '',
	`price_from` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` int NOT NULL DEFAULT 1,
	`whatsapp_number` varchar(32) NOT NULL,
	`email` varchar(256) NOT NULL,
	`instagram_url` varchar(512) NOT NULL,
	`instagram_handle` varchar(64) NOT NULL,
	`founder` varchar(128) NOT NULL,
	`location` varchar(256) NOT NULL,
	CONSTRAINT `site_settings_id` PRIMARY KEY(`id`)
);
