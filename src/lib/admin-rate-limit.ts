export const RATE_LIMIT_MESSAGE = "Too many login attempts. Please wait 15 minutes and try again.";

export type RateLimitScope = "ip" | "email" | "ip_email";

export type RateLimitRecord = {
  failureCount: number;
  windowStartedAt: number;
  lockedUntil: number | null;
};

export type RateLimitConfig = {
  maxFailures: number;
  windowMs: number;
  lockMs: number;
};

export const RATE_LIMITS: Record<RateLimitScope, RateLimitConfig> = {
  ip_email: { maxFailures: 5, windowMs: 15 * 60 * 1000, lockMs: 15 * 60 * 1000 },
  ip: { maxFailures: 25, windowMs: 15 * 60 * 1000, lockMs: 15 * 60 * 1000 },
  email: { maxFailures: 20, windowMs: 60 * 60 * 1000, lockMs: 15 * 60 * 1000 },
};

export function normalizeRateLimitEmail(email: string) {
  return email.toLowerCase().trim();
}

export function buildAttemptKeys(ip: string, email: string) {
  const normalizedEmail = normalizeRateLimitEmail(email);
  const normalizedIp = ip.trim() || "unknown";
  return {
    ip: normalizedIp,
    email: normalizedEmail,
    ip_email: `${normalizedIp}|${normalizedEmail}`,
  } as const;
}

export function isRateLimited(record: RateLimitRecord | undefined, now: number) {
  return Boolean(record?.lockedUntil && now < record.lockedUntil);
}

export function nextFailureState(
  record: RateLimitRecord | undefined,
  now: number,
  config: RateLimitConfig,
): RateLimitRecord {
  const windowExpired = !record || now - record.windowStartedAt >= config.windowMs;
  const base: RateLimitRecord = windowExpired
    ? { failureCount: 0, windowStartedAt: now, lockedUntil: null }
    : {
        failureCount: record.failureCount,
        windowStartedAt: record.windowStartedAt,
        lockedUntil: record.lockedUntil && now < record.lockedUntil ? record.lockedUntil : null,
      };

  const failureCount = base.failureCount + 1;
  if (failureCount >= config.maxFailures) {
    return {
      failureCount: 0,
      windowStartedAt: now,
      lockedUntil: now + config.lockMs,
    };
  }

  return {
    failureCount,
    windowStartedAt: base.windowStartedAt,
    lockedUntil: null,
  };
}

export function clientIpFromHeaders(headers: { get(name: string): string | null | undefined }) {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 128);
  }

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 128);

  return "unknown";
}

export function isStaleRateLimitRecord(record: RateLimitRecord, now: number, maxAgeMs: number) {
  const unlocked = !record.lockedUntil || now >= record.lockedUntil;
  return unlocked && now - record.windowStartedAt >= maxAgeMs;
}
