import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";

import { getDb, isDatabaseConfigured } from "@/db/index.server";
import { adminUsers } from "@/db/schema";
import { getServerConfig } from "@/lib/config.server";

const SESSION_COOKIE = "dainty_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type AdminSession = {
  userId: number;
  email: string;
  name: string;
};

function getSessionSecret() {
  const secret = getServerConfig().adminSessionSecret;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not configured");
  }
  return secret;
}

function signToken(payload: string) {
  const sig = createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function verifyToken(token: string): string | null {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;

  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expected = createHmac("sha256", getSessionSecret()).update(payload).digest("hex");

  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  return payload;
}

function encodeSession(session: AdminSession) {
  const payload = Buffer.from(JSON.stringify({ ...session, exp: Date.now() + SESSION_MAX_AGE * 1000 })).toString("base64url");
  return signToken(payload);
}

function decodeSession(token: string): AdminSession | null {
  const payload = verifyToken(token);
  if (!payload) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession & { exp: number };
    if (!data.userId || !data.email || Date.now() > data.exp) return null;
    return { userId: data.userId, email: data.email, name: data.name };
  } catch {
    return null;
  }
}

export function setAdminSession(session: AdminSession) {
  setCookie(SESSION_COOKIE, encodeSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearAdminSession() {
  deleteCookie(SESSION_COOKIE, { path: "/" });
}

export function getAdminSession(): AdminSession | null {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return null;
  return decodeSession(token);
}

export async function verifyAdminCredentials(email: string, password: string): Promise<AdminSession | null> {
  if (!isDatabaseConfigured()) return null;

  const db = getDb();
  const rows = await db.select().from(adminUsers).where(eq(adminUsers.email, email.toLowerCase().trim())).limit(1);
  const user = rows[0];
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return { userId: user.id, email: user.email, name: user.name };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function generateSessionSecret() {
  return randomBytes(32).toString("hex");
}
