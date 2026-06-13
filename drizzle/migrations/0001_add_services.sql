CREATE TABLE IF NOT EXISTS `services` (
	`id` varchar(64) NOT NULL,
	`title` varchar(256) NOT NULL,
	`blurb` text NOT NULL,
	`bullets` json NOT NULL,
	`image_path` varchar(512) NOT NULL DEFAULT '',
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `site_settings` ADD `services_intro` text DEFAULT ('') NOT NULL;
--> statement-breakpoint
ALTER TABLE `site_settings` ADD `services_footer_title` varchar(256) DEFAULT ('') NOT NULL;
--> statement-breakpoint
ALTER TABLE `site_settings` ADD `services_footer_blurb` text DEFAULT ('') NOT NULL;
