CREATE TABLE IF NOT EXISTS `blog_posts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `title` varchar(256) NOT NULL,
  `slug` varchar(160) NOT NULL,
  `excerpt` text NOT NULL,
  `content` text NOT NULL,
  `featured_image` varchar(512),
  `meta_title` varchar(256),
  `meta_description` text,
  `is_published` boolean NOT NULL DEFAULT false,
  `published_at` timestamp NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `blog_posts_id` PRIMARY KEY (`id`),
  CONSTRAINT `blog_posts_slug_unique` UNIQUE (`slug`)
);
