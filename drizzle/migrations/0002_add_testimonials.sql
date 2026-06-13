CREATE TABLE IF NOT EXISTS `testimonials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quote` text NOT NULL,
	`customer_name` varchar(128) NOT NULL,
	`location` varchar(128) NOT NULL,
	`context` varchar(128) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `testimonials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `site_settings` ADD `testimonials_heading` varchar(256) DEFAULT ('') NOT NULL;
