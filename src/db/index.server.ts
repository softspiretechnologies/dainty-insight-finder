import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import * as schema from "./schema";

let pool: mysql.Pool | undefined;

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function normalizeDatabaseUrl(url: string) {
  return url.replace(/@localhost([:/])/i, "@127.0.0.1$1");
}

function poolFromUrl(url: string) {
  const parsed = new URL(url);
  return mysql.createPool({
    host: parsed.hostname,
    port: Number(parsed.port) || 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
    connectionLimit: 10,
    waitForConnections: true,
    enableKeepAlive: true,
  });
}

export function getDb() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!pool) {
    pool = poolFromUrl(normalizeDatabaseUrl(raw));
  }

  return drizzle(pool, { schema, mode: "default" });
}
