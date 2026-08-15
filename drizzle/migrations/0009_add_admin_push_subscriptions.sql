-- Documentary / fresh-install migration. Production Hostinger uses db:ensure, not db:migrate.
CREATE TABLE IF NOT EXISTS `admin_push_subscriptions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `admin_user_id` int NOT NULL,
  `endpoint` text NOT NULL,
  `endpoint_hash` varchar(64) NOT NULL,
  `p256dh` varchar(256) NOT NULL,
  `auth` varchar(128) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `admin_push_subscriptions_id` PRIMARY KEY (`id`),
  UNIQUE KEY `admin_push_subscriptions_endpoint_hash_unique` (`endpoint_hash`)
);
