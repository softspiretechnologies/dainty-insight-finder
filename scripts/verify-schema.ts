import mysql from "mysql2/promise";

import "./load-env.ts";
import { inspectSchema } from "./lib/schema-inspect";
import { diffExpectedSchema, formatVerifyFailure } from "../src/lib/schema-expectations";

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("Database schema is outdated.");
    console.error("");
    console.error("Missing:");
    console.error("- DATABASE_URL is not set");
    process.exit(1);
  }

  const pool = mysql.createPool(databaseUrl);
  const conn = await pool.getConnection();

  try {
    const issues = diffExpectedSchema(await inspectSchema(conn));
    if (issues.length > 0) {
      console.error(formatVerifyFailure(issues));
      process.exit(1);
    }
    console.log("Database schema verified.");
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch(() => {
  console.error("Database schema is outdated.");
  console.error("");
  console.error("Missing:");
  console.error("- schema verification could not inspect the database");
  process.exit(1);
});
