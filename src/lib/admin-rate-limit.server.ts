const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

const attempts = new Map<string, { count: number; lockedUntil: number }>();

export function checkLoginRateLimit(key: string): string | null {
  const normalized = key.toLowerCase().trim();
  const entry = attempts.get(normalized);
  if (entry && Date.now() < entry.lockedUntil) {
    return "Too many login attempts. Please wait 15 minutes and try again.";
  }
  return null;
}

export function recordLoginFailure(key: string) {
  const normalized = key.toLowerCase().trim();
  const entry = attempts.get(normalized) ?? { count: 0, lockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_MS;
    entry.count = 0;
  }
  attempts.set(normalized, entry);
}

export function clearLoginAttempts(key: string) {
  attempts.delete(key.toLowerCase().trim());
}
