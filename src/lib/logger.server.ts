import { randomBytes } from "node:crypto";

const SENSITIVE_KEY =
  /(password|secret|cookie|authorization|database_?url|token|session|credential)/i;

function safeValue(value: unknown, key?: string): unknown {
  if (key && SENSITIVE_KEY.test(key)) return "[REDACTED]";
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      ...(process.env.NODE_ENV !== "production" && value.stack ? { stack: value.stack } : {}),
    };
  }
  if (Array.isArray(value)) return value.map((item) => safeValue(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        safeValue(entryValue, entryKey),
      ]),
    );
  }
  return value;
}

export function createErrorId() {
  return `ERR-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export function logError(event: string, error: unknown, context: Record<string, unknown> = {}) {
  const safeContext = safeValue(context) as Record<string, unknown>;
  const entry = {
    level: "error",
    event,
    timestamp: new Date().toISOString(),
    error: safeValue(error),
    ...safeContext,
  };
  console.error(JSON.stringify(entry));
}

export function logInfo(event: string, context: Record<string, unknown> = {}) {
  const safeContext = safeValue(context) as Record<string, unknown>;
  console.info(
    JSON.stringify({
      level: "info",
      event,
      timestamp: new Date().toISOString(),
      ...safeContext,
    }),
  );
}
