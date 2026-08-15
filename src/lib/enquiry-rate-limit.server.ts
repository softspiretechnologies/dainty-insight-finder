import { and, eq, isNull, lt, or } from "drizzle-orm";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";

import { getDb, isDatabaseConfigured } from "@/db/index.server";
import { adminLoginAttempts } from "@/db/schema";
import {
  clientIpFromHeaders,
  isRateLimited,
  isStaleRateLimitRecord,
  nextFailureState,
  type RateLimitConfig,
  type RateLimitRecord,
} from "@/lib/admin-rate-limit";

const ENQUIRY_SCOPE = "enquiry_ip";
const ENQUIRY_LIMIT: RateLimitConfig = {
  maxFailures: 8,
  windowMs: 15 * 60 * 1000,
  lockMs: 15 * 60 * 1000,
};
const ENQUIRY_RATE_LIMIT_MESSAGE =
  "Too many enquiries from this network. Please wait a few minutes and try again.";

const memoryStore = new Map<string, RateLimitRecord>();
const STALE_AFTER_MS = 2 * 60 * 60 * 1000;

function toRecord(row: typeof adminLoginAttempts.$inferSelect): RateLimitRecord {
  return {
    failureCount: row.failureCount,
    windowStartedAt: row.windowStartedAt.getTime(),
    lockedUntil: row.lockedUntil ? row.lockedUntil.getTime() : null,
  };
}

async function loadRecord(key: string): Promise<RateLimitRecord | undefined> {
  if (isDatabaseConfigured()) {
    try {
      const rows = await getDb()
        .select()
        .from(adminLoginAttempts)
        .where(
          and(eq(adminLoginAttempts.scope, ENQUIRY_SCOPE), eq(adminLoginAttempts.attemptKey, key)),
        )
        .limit(1);
      if (rows[0]) return toRecord(rows[0]);
      return undefined;
    } catch {
      // table may be missing
    }
  }
  return memoryStore.get(key);
}

async function saveRecord(key: string, record: RateLimitRecord) {
  if (isDatabaseConfigured()) {
    try {
      const values = {
        scope: ENQUIRY_SCOPE,
        attemptKey: key,
        failureCount: record.failureCount,
        windowStartedAt: new Date(record.windowStartedAt),
        lockedUntil: record.lockedUntil ? new Date(record.lockedUntil) : null,
      };
      await getDb()
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
      // fall through
    }
  }
  memoryStore.set(key, record);
}

export function getEnquiryClientIp() {
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

export async function checkEnquiryRateLimit(ip: string): Promise<string | null> {
  const key = ip.trim() || "unknown";
  const record = await loadRecord(key);
  if (isRateLimited(record, Date.now())) return ENQUIRY_RATE_LIMIT_MESSAGE;
  return null;
}

/** Count a successful or attempted public submission toward the IP throttle. */
export async function recordEnquirySubmission(ip: string) {
  const key = ip.trim() || "unknown";
  const now = Date.now();
  const current = await loadRecord(key);
  if (isRateLimited(current, now)) return;
  await saveRecord(key, nextFailureState(current, now, ENQUIRY_LIMIT));
}

export async function cleanupExpiredEnquiryAttempts(now = Date.now()) {
  const staleBefore = new Date(now - STALE_AFTER_MS);
  if (isDatabaseConfigured()) {
    try {
      await getDb()
        .delete(adminLoginAttempts)
        .where(
          and(
            eq(adminLoginAttempts.scope, ENQUIRY_SCOPE),
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
    if (isStaleRateLimitRecord(record, now, STALE_AFTER_MS)) memoryStore.delete(key);
  }
}
