-- Documentary / fresh-install migration. Production Hostinger uses db:ensure, not db:migrate.
CREATE TABLE IF NOT EXISTS `enquiries` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(128) NOT NULL,
  `phone` varchar(32) NOT NULL,
  `email` varchar(256),
  `event_type` varchar(128),
  `event_date` varchar(32),
  `budget` varchar(128),
  `message` text NOT NULL,
  `source` varchar(32) NOT NULL DEFAULT 'general',
  `product_id` int,
  `product_name_snapshot` varchar(256),
  `service_id` varchar(64),
  `service_title_snapshot` varchar(256),
  `status` varchar(32) NOT NULL DEFAULT 'new',
  `admin_notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `enquiries_id` PRIMARY KEY (`id`)
);
