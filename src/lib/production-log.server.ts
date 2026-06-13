type LogLevel = "LOG" | "ERROR" | "WARN";

function stamp() {
  return new Date().toISOString();
}

export function prodLog(level: LogLevel, message: string, extra?: Record<string, unknown>) {
  const line = {
    timestamp: stamp(),
    level,
    message,
    ...(extra ? { extra } : {}),
  };
  const text = JSON.stringify(line);
  if (level === "ERROR") {
    console.error(text);
  } else if (level === "WARN") {
    console.warn(text);
  } else {
    console.log(text);
  }
}

export function maskDatabaseUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = "***";
    return parsed.toString();
  } catch {
    return "(invalid DATABASE_URL)";
  }
}

export function formatProdError(error: unknown, depth = 0): Record<string, unknown> {
  if (depth > 4) return { message: String(error) };

  if (error instanceof Error) {
    const formatted: Record<string, unknown> = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: "code" in error ? String((error as { code?: unknown }).code) : undefined,
      errno: "errno" in error ? (error as { errno?: unknown }).errno : undefined,
      sqlState: "sqlState" in error ? (error as { sqlState?: unknown }).sqlState : undefined,
      sqlMessage: "sqlMessage" in error ? (error as { sqlMessage?: unknown }).sqlMessage : undefined,
    };

    if ("cause" in error && error.cause) {
      formatted.cause = formatProdError(error.cause, depth + 1);
    }

    return formatted;
  }

  return { message: String(error) };
}

let startupLogged = false;
let processHooksInstalled = false;

export function installProcessErrorLogging() {
  if (processHooksInstalled) return;
  processHooksInstalled = true;

  process.on("uncaughtException", (error) => {
    prodLog("ERROR", "uncaughtException", { error: formatProdError(error) });
  });

  process.on("unhandledRejection", (reason) => {
    prodLog("ERROR", "unhandledRejection", { error: formatProdError(reason) });
  });
}

export function logStartupDiagnostics(entry: string) {
  if (startupLogged) return;
  startupLogged = true;

  const dbUrl = process.env.DATABASE_URL?.trim();
  prodLog("LOG", "DaintyHand server starting", {
    entry,
    nodeVersion: process.version,
    nodeEnv: process.env.NODE_ENV ?? "(unset)",
    platform: process.platform,
    cwd: process.cwd(),
    databaseConfigured: Boolean(dbUrl),
    databaseHost: dbUrl ? maskDatabaseUrl(dbUrl) : null,
    adminSessionSecretSet: Boolean(process.env.ADMIN_SESSION_SECRET?.trim()),
    viteSiteUrl: process.env.VITE_SITE_URL ?? "(unset)",
    stdinShim: !(process.stdin as { readable?: boolean } | undefined)?.readable,
  });
}

export function logRequestFailure(method: string, url: string, error: unknown, context?: string) {
  prodLog("ERROR", "Request failed", {
    method,
    url,
    context: context ?? "fetch",
    error: formatProdError(error),
  });
}

export async function logDatabaseCheck() {
  const dbUrl = process.env.DATABASE_URL?.trim();
  if (!dbUrl) {
    prodLog("WARN", "DATABASE_URL not set — using static catalog fallback");
    return;
  }

  try {
    const mysql = await import("mysql2/promise");
    const normalized = dbUrl.replace(/@localhost([:/])/i, "@127.0.0.1$1");
    const conn = await mysql.createConnection(normalized);
    const [dbRow] = await conn.query("SELECT DATABASE() as db");
    const currentDb = (dbRow as Array<{ db: string | null }>)[0]?.db;
    const [tables] = await conn.query("SHOW TABLES");
    const tableNames = (tables as Array<Record<string, string>>).map((r) => Object.values(r)[0]);
    const [rows] = await conn.query("SELECT COUNT(*) as c FROM categories");
    const count = (rows as Array<{ c: number }>)[0]?.c ?? 0;
    await conn.end();
    prodLog("LOG", "Database connection OK", {
      host: maskDatabaseUrl(normalized),
      database: currentDb,
      tables: tableNames,
      categoryCount: count,
    });
  } catch (error) {
    prodLog("ERROR", "Database connection FAILED", {
      host: maskDatabaseUrl(dbUrl),
      error: formatProdError(error),
    });
  }
}
