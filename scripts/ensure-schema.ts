import mysql from "mysql2/promise";

import "./load-env.ts";

const statements = [
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
];

const siteSettingsColumns: Array<{ name: string; ddl: string }> = [
  { name: "services_intro", ddl: "ALTER TABLE `site_settings` ADD `services_intro` text NOT NULL DEFAULT ('')" },
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
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Schema ensure failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
