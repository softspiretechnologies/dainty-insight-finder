import { describe, expect, it } from "vitest";

import {
  RATE_LIMITS,
  buildAttemptKeys,
  clientIpFromHeaders,
  isRateLimited,
  isStaleRateLimitRecord,
  nextFailureState,
  normalizeRateLimitEmail,
} from "@/lib/admin-rate-limit";

const now = 1_700_000_000_000;

describe("login rate-limit keys", () => {
  it("normalizes email and builds ip, email, and combined keys", () => {
    expect(normalizeRateLimitEmail("  Admin@Example.COM ")).toBe("admin@example.com");
    expect(buildAttemptKeys("203.0.113.10", "Admin@Example.COM")).toEqual({
      ip: "203.0.113.10",
      email: "admin@example.com",
      ip_email: "203.0.113.10|admin@example.com",
    });
  });
});

describe("rate-limit evaluation", () => {
  it("locks ip+email after the strict short-term limit", () => {
    let record = undefined as ReturnType<typeof nextFailureState> | undefined;
    for (let i = 0; i < RATE_LIMITS.ip_email.maxFailures; i++) {
      record = nextFailureState(record, now + i, RATE_LIMITS.ip_email);
    }
    expect(isRateLimited(record, now + 1_000)).toBe(true);
    expect(isRateLimited(record, (record?.lockedUntil ?? 0) + 1)).toBe(false);
  });

  it("requires more failures before locking a whole IP", () => {
    let record = undefined as ReturnType<typeof nextFailureState> | undefined;
    for (let i = 0; i < RATE_LIMITS.ip.maxFailures - 1; i++) {
      record = nextFailureState(record, now, RATE_LIMITS.ip);
    }
    expect(isRateLimited(record, now)).toBe(false);
    record = nextFailureState(record, now, RATE_LIMITS.ip);
    expect(isRateLimited(record, now + 1)).toBe(true);
  });

  it("uses a higher, slower threshold for email-only lockouts", () => {
    expect(RATE_LIMITS.email.maxFailures).toBeGreaterThan(RATE_LIMITS.ip_email.maxFailures);
    expect(RATE_LIMITS.email.windowMs).toBeGreaterThan(RATE_LIMITS.ip_email.windowMs);
  });

  it("resets the window after it expires", () => {
    let record = nextFailureState(undefined, now, RATE_LIMITS.ip_email);
    record = nextFailureState(
      record,
      now + RATE_LIMITS.ip_email.windowMs + 1,
      RATE_LIMITS.ip_email,
    );
    expect(record.failureCount).toBe(1);
    expect(record.lockedUntil).toBeNull();
  });

  it("identifies stale unlocked records for cleanup", () => {
    const record = { failureCount: 1, windowStartedAt: now, lockedUntil: null };
    expect(isStaleRateLimitRecord(record, now + 2 * 60 * 60 * 1000, 2 * 60 * 60 * 1000)).toBe(true);
    expect(isStaleRateLimitRecord(record, now + 1_000, 2 * 60 * 60 * 1000)).toBe(false);
  });
});

describe("clientIpFromHeaders", () => {
  it("uses the first x-forwarded-for hop", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.8, 10.0.0.1" });
    expect(clientIpFromHeaders(headers)).toBe("203.0.113.8");
  });

  it("falls back to x-real-ip and then unknown", () => {
    expect(clientIpFromHeaders(new Headers({ "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
    expect(clientIpFromHeaders(new Headers())).toBe("unknown");
  });
});
