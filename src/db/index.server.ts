import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import * as schema from "./schema";

let pool: mysql.Pool | undefined;

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function normalizeDatabaseUrl(url: string) {
  // Hostinger + Node 22: "localhost" can use unix socket / IPv6 and fail silently.
  return url.replace(/@localhost([:/])/i, "@127.0.0.1$1");
}

export function getDb() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    throw new Error("DATABASE_URL is not configured");
  }
  const url = normalizeDatabaseUrl(raw);

  if (!pool) {
    pool = mysql.createPool(url);
  }

  return drizzle(pool, { schema, mode: "default" });
}
