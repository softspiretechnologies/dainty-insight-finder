import { and, eq, isNull, lt, or } from "drizzle-orm";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";

import { getDb, isDatabaseConfigured } from "@/db/index.server";
import { adminLoginAttempts } from "@/db/schema";
import {
  RATE_LIMIT_MESSAGE,
  RATE_LIMITS,
  buildAttemptKeys,
  clientIpFromHeaders,
  isRateLimited,
  isStaleRateLimitRecord,
  nextFailureState,
  type RateLimitRecord,
  type RateLimitScope,
} from "@/lib/admin-rate-limit";

const memoryStore = new Map<string, RateLimitRecord>();
const STALE_AFTER_MS = 2 * 60 * 60 * 1000;

function memoryKey(scope: RateLimitScope, key: string) {
  return `${scope}:${key}`;
}

function toRecord(row: typeof adminLoginAttempts.$inferSelect): RateLimitRecord {
  return {
    failureCount: row.failureCount,
    windowStartedAt: row.windowStartedAt.getTime(),
    lockedUntil: row.lockedUntil ? row.lockedUntil.getTime() : null,
  };
}

async function loadRecord(
  scope: RateLimitScope,
  key: string,
): Promise<RateLimitRecord | undefined> {
  if (isDatabaseConfigured()) {
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(adminLoginAttempts)
        .where(and(eq(adminLoginAttempts.scope, scope), eq(adminLoginAttempts.attemptKey, key)))
        .limit(1);
      if (rows[0]) return toRecord(rows[0]);
      return undefined;
    } catch {
      // Table may not exist yet — fall back to memory.
    }
  }

  return memoryStore.get(memoryKey(scope, key));
}

async function saveRecord(scope: RateLimitScope, key: string, record: RateLimitRecord) {
  if (isDatabaseConfigured()) {
    try {
      const db = getDb();
      const values = {
        scope,
        attemptKey: key,
        failureCount: record.failureCount,
        windowStartedAt: new Date(record.windowStartedAt),
        lockedUntil: record.lockedUntil ? new Date(record.lockedUntil) : null,
      };

      await db
        .insert(adminLoginAttempts)
        .values(values)
        .onDuplicateKeyUpdate({
          set: {
            failureCount: values.failureCount,
            windowStartedAt: values.windowStartedAt,
            lockedUntil: values.lockedUntil,
          },
        });
      return;
    } catch {
      // fall through to memory
    }
  }

  memoryStore.set(memoryKey(scope, key), record);
}

async function deleteRecord(scope: RateLimitScope, key: string) {
  if (isDatabaseConfigured()) {
    try {
      const db = getDb();
      await db
        .delete(adminLoginAttempts)
        .where(and(eq(adminLoginAttempts.scope, scope), eq(adminLoginAttempts.attemptKey, key)));
    } catch {
      // ignore
    }
  }

  memoryStore.delete(memoryKey(scope, key));
}

export function getLoginClientIp() {
  try {
    const forwarded = getRequestIP({ xForwardedFor: true });
    if (forwarded) return forwarded.slice(0, 128);
    return clientIpFromHeaders({
      get: (name: string) => getRequestHeader(name) ?? null,
    });
  } catch {
    return "unknown";
  }
}

export async function checkLoginRateLimit(ip: string, email: string): Promise<string | null> {
  const keys = buildAttemptKeys(ip, email);
  const now = Date.now();

  for (const scope of ["ip_email", "ip", "email"] as const) {
    const record = await loadRecord(scope, keys[scope]);
    if (isRateLimited(record, now)) return RATE_LIMIT_MESSAGE;
  }

  return null;
}

export async function recordLoginFailure(ip: string, email: string) {
  const keys = buildAttemptKeys(ip, email);
  const now = Date.now();

  for (const scope of ["ip_email", "ip", "email"] as const) {
    const current = await loadRecord(scope, keys[scope]);
    if (isRateLimited(current, now)) continue;
    const next = nextFailureState(current, now, RATE_LIMITS[scope]);
    await saveRecord(scope, keys[scope], next);
  }
}

export async function clearLoginAttempts(ip: string, email: string) {
  const keys = buildAttemptKeys(ip, email);
  await Promise.all([
    deleteRecord("ip_email", keys.ip_email),
    deleteRecord("ip", keys.ip),
    deleteRecord("email", keys.email),
  ]);
}

export async function cleanupExpiredLoginAttempts(now = Date.now()) {
  const staleBefore = new Date(now - STALE_AFTER_MS);

  if (isDatabaseConfigured()) {
    try {
      const db = getDb();
      await db
        .delete(adminLoginAttempts)
        .where(
          and(
            or(
              isNull(adminLoginAttempts.lockedUntil),
              lt(adminLoginAttempts.lockedUntil, new Date(now)),
            ),
            lt(adminLoginAttempts.windowStartedAt, staleBefore),
          ),
        );
    } catch {
      // ignore
    }
  }

  for (const [key, record] of memoryStore) {
    if (isStaleRateLimitRecord(record, now, STALE_AFTER_MS)) {
      memoryStore.delete(key);
    }
  }
}
