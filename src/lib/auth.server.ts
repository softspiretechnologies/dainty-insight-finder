import { eq, sql } from "drizzle-orm";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";

import bcrypt from "bcryptjs";

import { getDb, isDatabaseConfigured } from "@/db/index.server";
import { adminUsers } from "@/db/schema";
import {
  ADMIN_SESSION_MAX_AGE_SECONDS,
  encodeAdminSession,
  resolveAdminSession,
  type AdminSession,
} from "@/lib/admin-session";
import { getServerConfig } from "@/lib/config.server";

export type { AdminSession };

const SESSION_COOKIE = "dainty_admin_session";

function getSessionSecret() {
  const secret = getServerConfig().adminSessionSecret;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not configured");
  }
  return secret;
}

async function loadAdminUser(userId: number) {
  if (!isDatabaseConfigured()) return null;

  const db = getDb();
  const rows = await db.select().from(adminUsers).where(eq(adminUsers.id, userId)).limit(1);
  const user = rows[0];
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    sessionVersion: user.sessionVersion ?? 0,
  };
}

export function setAdminSession(session: AdminSession & { sessionVersion: number }) {
  setCookie(SESSION_COOKIE, encodeAdminSession(session, getSessionSecret()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
}

export function clearAdminSession() {
  deleteCookie(SESSION_COOKIE, { path: "/" });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return null;
  if (!getServerConfig().adminSessionSecret) return null;

  try {
    return await resolveAdminSession(token, getServerConfig().adminSessionSecret, loadAdminUser);
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function verifyAdminCredentials(
  email: string,
  password: string,
): Promise<(AdminSession & { sessionVersion: number }) | null> {
  if (!isDatabaseConfigured()) return null;

  const db = getDb();
  const rows = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email.toLowerCase().trim()))
    .limit(1);
  const user = rows[0];
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    sessionVersion: user.sessionVersion ?? 0,
  };
}

export async function incrementAdminSessionVersion(userId: number) {
  const db = getDb();
  await db
    .update(adminUsers)
    .set({ sessionVersion: sql`${adminUsers.sessionVersion} + 1` })
    .where(eq(adminUsers.id, userId));
}
