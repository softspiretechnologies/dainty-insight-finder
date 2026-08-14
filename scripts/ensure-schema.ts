import mysql from "mysql2/promise";

import "./load-env.ts";

const statements = [
  `CREATE TABLE IF NOT EXISTS \`admin_users\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`email\` varchar(256) NOT NULL,
    \`password_hash\` varchar(256) NOT NULL,
    \`name\` varchar(128) NOT NULL,
    \`session_version\` int NOT NULL DEFAULT 0,
    CONSTRAINT \`admin_users_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`admin_users_email_unique\` UNIQUE(\`email\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`categories\` (
    \`id\` varchar(32) NOT NULL,
    \`label\` varchar(128) NOT NULL,
    \`blurb\` text NOT NULL,
    \`image_path\` varchar(512) NOT NULL DEFAULT '',
    \`sort_order\` int NOT NULL DEFAULT 0,
    CONSTRAINT \`categories_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`products\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`slug\` varchar(128) NOT NULL,
    \`name\` varchar(256) NOT NULL,
    \`category_id\` varchar(32) NOT NULL,
    \`blurb\` text NOT NULL,
    \`description\` text NOT NULL,
    \`details\` json NOT NULL,
    \`image_path\` varchar(512) NOT NULL DEFAULT '',
    \`price_from\` varchar(64),
    \`is_active\` boolean NOT NULL DEFAULT true,
    \`featured_on_homepage\` boolean NOT NULL DEFAULT false,
    \`homepage_sort_order\` int NOT NULL DEFAULT 0,
    \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`products_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`products_slug_unique\` UNIQUE(\`slug\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`site_settings\` (
    \`id\` int NOT NULL DEFAULT 1,
    \`whatsapp_number\` varchar(32) NOT NULL,
    \`email\` varchar(256) NOT NULL,
    \`instagram_url\` varchar(512) NOT NULL,
    \`instagram_handle\` varchar(64) NOT NULL,
    \`founder\` varchar(128) NOT NULL,
    \`location\` varchar(256) NOT NULL,
    \`services_intro\` text NOT NULL DEFAULT ('') ,
    \`services_footer_title\` varchar(256) NOT NULL DEFAULT ('') ,
    \`services_footer_blurb\` text NOT NULL DEFAULT ('') ,
    \`testimonials_heading\` varchar(256) NOT NULL DEFAULT ('') ,
    CONSTRAINT \`site_settings_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`blog_posts\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`title\` varchar(256) NOT NULL,
    \`slug\` varchar(160) NOT NULL,
    \`excerpt\` text NOT NULL,
    \`content\` text NOT NULL,
    \`featured_image\` varchar(512),
    \`meta_title\` varchar(256),
    \`meta_description\` text,
    \`is_published\` boolean NOT NULL DEFAULT false,
    \`published_at\` timestamp NULL,
    \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`blog_posts_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`blog_posts_slug_unique\` UNIQUE(\`slug\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`services\` (
    \`id\` varchar(64) NOT NULL,
    \`title\` varchar(256) NOT NULL,
    \`blurb\` text NOT NULL,
    \`bullets\` json NOT NULL,
    \`image_path\` varchar(512) NOT NULL DEFAULT '',
    \`sort_order\` int NOT NULL DEFAULT 0,
    CONSTRAINT \`services_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`testimonials\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`quote\` text NOT NULL,
    \`customer_name\` varchar(128) NOT NULL,
    \`location\` varchar(128) NOT NULL,
    \`context\` varchar(128) NOT NULL,
    \`sort_order\` int NOT NULL DEFAULT 0,
    CONSTRAINT \`testimonials_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`admin_login_attempts\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`scope\` varchar(16) NOT NULL,
    \`attempt_key\` varchar(320) NOT NULL,
    \`failure_count\` int NOT NULL DEFAULT 0,
    \`window_started_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`locked_until\` timestamp NULL,
    \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`admin_login_attempts_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`admin_login_attempts_scope_key\` UNIQUE(\`scope\`, \`attempt_key\`)
  )`,
];

const siteSettingsColumns: Array<{ name: string; ddl: string }> = [
  {
    name: "services_intro",
    ddl: "ALTER TABLE `site_settings` ADD `services_intro` text NOT NULL DEFAULT ('')",
  },
  {
    name: "services_footer_title",
    ddl: "ALTER TABLE `site_settings` ADD `services_footer_title` varchar(256) NOT NULL DEFAULT ('')",
  },
  {
    name: "services_footer_blurb",
    ddl: "ALTER TABLE `site_settings` ADD `services_footer_blurb` text NOT NULL DEFAULT ('')",
  },
  {
    name: "testimonials_heading",
    ddl: "ALTER TABLE `site_settings` ADD `testimonials_heading` varchar(256) NOT NULL DEFAULT ('')",
  },
];

const productColumns: Array<{ name: string; ddl: string }> = [
  {
    name: "is_active",
    ddl: "ALTER TABLE `products` ADD `is_active` boolean NOT NULL DEFAULT true",
  },
  {
    name: "featured_on_homepage",
    ddl: "ALTER TABLE `products` ADD `featured_on_homepage` boolean NOT NULL DEFAULT false",
  },
  {
    name: "homepage_sort_order",
    ddl: "ALTER TABLE `products` ADD `homepage_sort_order` int NOT NULL DEFAULT 0",
  },
];

const adminUserColumns: Array<{ name: string; ddl: string }> = [
  {
    name: "session_version",
    ddl: "ALTER TABLE `admin_users` ADD `session_version` int NOT NULL DEFAULT 0",
  },
];

async function columnExists(conn: mysql.Connection, table: string, column: string) {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1",
    [table, column],
  );
  return rows.length > 0;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.log("DATABASE_URL not set — skipping schema ensure.");
    return;
  }

  const pool = mysql.createPool(databaseUrl);
  const conn = await pool.getConnection();

  try {
    for (const sql of statements) {
      await conn.query(sql);
    }

    for (const column of siteSettingsColumns) {
      if (!(await columnExists(conn, "site_settings", column.name))) {
        await conn.query(column.ddl);
        console.log(`Added site_settings.${column.name}`);
      }
    }

    for (const column of productColumns) {
      if (!(await columnExists(conn, "products", column.name))) {
        await conn.query(column.ddl);
        console.log(`Added products.${column.name}`);
      }
    }

    for (const column of adminUserColumns) {
      if (!(await columnExists(conn, "admin_users", column.name))) {
        await conn.query(column.ddl);
        console.log(`Added admin_users.${column.name}`);
      }
    }
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Schema ensure failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
