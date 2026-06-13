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
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Schema ensure failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
