import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type AdminSession = {
  userId: number;
  email: string;
  name: string;
};

export type AdminSessionPayload = AdminSession & {
  sessionVersion: number;
  exp: number;
};

export type AdminUserRecord = {
  id: number;
  email: string;
  name: string;
  sessionVersion: number;
};

export function signSessionToken(payload: string, secret: string) {
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string, secret: string): string | null {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;

  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("hex");

  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  return payload;
}

export function encodeAdminSession(
  session: AdminSession & { sessionVersion: number },
  secret: string,
  maxAgeSeconds = ADMIN_SESSION_MAX_AGE_SECONDS,
  now = Date.now(),
) {
  const payload = Buffer.from(
    JSON.stringify({
      userId: session.userId,
      email: session.email,
      name: session.name,
      sessionVersion: session.sessionVersion,
      exp: now + maxAgeSeconds * 1000,
    } satisfies AdminSessionPayload),
  ).toString("base64url");
  return signSessionToken(payload, secret);
}

export function decodeAdminSession(
  token: string,
  secret: string,
  now = Date.now(),
): AdminSessionPayload | null {
  const payload = verifySessionToken(token, secret);
  if (!payload) return null;

  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Partial<AdminSessionPayload>;
    if (!data.userId || !data.email || typeof data.exp !== "number" || now > data.exp) {
      return null;
    }
    return {
      userId: data.userId,
      email: data.email,
      name: typeof data.name === "string" ? data.name : "",
      sessionVersion: typeof data.sessionVersion === "number" ? data.sessionVersion : 0,
      exp: data.exp,
    };
  } catch {
    return null;
  }
}

export function isSessionVersionCurrent(cookieVersion: number, dbVersion: number) {
  return cookieVersion === dbVersion;
}

export async function resolveAdminSession(
  token: string | undefined,
  secret: string | undefined,
  loadUser: (userId: number) => Promise<AdminUserRecord | null>,
  now = Date.now(),
): Promise<AdminSession | null> {
  if (!token || !secret) return null;

  const decoded = decodeAdminSession(token, secret, now);
  if (!decoded) return null;

  const user = await loadUser(decoded.userId);
  if (!user) return null;
  if (!isSessionVersionCurrent(decoded.sessionVersion, user.sessionVersion)) return null;

  return { userId: user.id, email: user.email, name: user.name };
}
