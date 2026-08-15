import mysql from "mysql2/promise";

import "./load-env.ts";
import { inspectSchema } from "./lib/schema-inspect";
import {
  diffExpectedSchema,
  planEnsureActions,
  type SchemaIssue,
} from "../src/lib/schema-expectations";

function printIssue(prefix: string, issue: SchemaIssue) {
  console.log(`${prefix} ${issue.message}`);
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
    const before = diffExpectedSchema(await inspectSchema(conn));
    const { apply, abort } = planEnsureActions(before);

    for (const issue of apply) {
      if (!issue.sql) continue;
      try {
        await conn.query(issue.sql);
        printIssue("Added", issue);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown database error";
        throw new Error(`Failed to add ${issue.message}: ${message}`);
      }
    }

    const after = diffExpectedSchema(await inspectSchema(conn));
    const remaining = planEnsureActions(after);

    if (remaining.abort.length > 0) {
      console.error("Schema ensure stopped: incompatible objects must be reviewed manually.");
      for (const issue of remaining.abort) printIssue("Incompatible", issue);
      process.exitCode = 1;
      return;
    }

    if (remaining.apply.length > 0) {
      console.error("Schema ensure incomplete. Remaining:");
      for (const issue of remaining.apply) printIssue("-", issue);
      process.exitCode = 1;
      return;
    }

    if (apply.length === 0) {
      console.log("Database schema already current.");
    } else {
      console.log("Database schema reconciled.");
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
