import { constants } from "node:fs";
import { access, mkdir } from "node:fs/promises";

import { createFileRoute } from "@tanstack/react-router";
import { sql } from "drizzle-orm";

import { getDb, isDatabaseConfigured } from "@/db/index.server";
import { logError } from "@/lib/logger.server";
import { getUploadsRoot } from "@/lib/uploads.server";

async function databaseHealth() {
  if (!isDatabaseConfigured()) return false;
  await getDb().execute(sql`SELECT 1`);
  return true;
}

async function uploadsHealth() {
  const root = getUploadsRoot();
  await mkdir(root, { recursive: true });
  await access(root, constants.R_OK | constants.W_OK);
  return true;
}

export const Route = createFileRoute("/health")({
  server: {
    handlers: {
      GET: async () => {
        const [database, uploads] = await Promise.allSettled([databaseHealth(), uploadsHealth()]);
        const databaseOk = database.status === "fulfilled" && database.value;
        const uploadsOk = uploads.status === "fulfilled" && uploads.value;
        const healthy = databaseOk && uploadsOk;

        if (!healthy) {
          if (database.status === "rejected") {
            logError("health.database_failure", database.reason, { operation: "SELECT 1" });
          }
          if (uploads.status === "rejected") {
            logError("health.uploads_failure", uploads.reason, { operation: "access" });
          }
        }

        return Response.json(
          {
            status: healthy ? "ok" : "error",
            database: databaseOk ? "ok" : "error",
            uploads: uploadsOk ? "ok" : "error",
          },
          {
            status: healthy ? 200 : 503,
            headers: { "Cache-Control": "no-store" },
          },
        );
      },
    },
  },
});
