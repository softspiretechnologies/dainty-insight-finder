import { createServerFn } from "@tanstack/react-start";

import { loginSchema } from "@/lib/admin-schemas";
import {
  checkLoginRateLimit,
  clearLoginAttempts,
  cleanupExpiredLoginAttempts,
  getLoginClientIp,
  recordLoginFailure,
} from "@/lib/admin-rate-limit.server";
import {
  clearAdminSession,
  getAdminSession,
  setAdminSession,
  verifyAdminCredentials,
} from "@/lib/auth.server";

export const loginAdmin = createServerFn({ method: "POST" })
  .validator(loginSchema)
  .handler(async ({ data }) => {
    const ip = getLoginClientIp();
    const rateLimitError = await checkLoginRateLimit(ip, data.email);
    if (rateLimitError) {
      return { ok: false as const, error: rateLimitError };
    }

    let session;
    try {
      session = await verifyAdminCredentials(data.email, data.password);
    } catch {
      return { ok: false as const, error: "Invalid email or password" };
    }
    if (!session) {
      await recordLoginFailure(ip, data.email);
      return { ok: false as const, error: "Invalid email or password" };
    }

    await clearLoginAttempts(ip, data.email);
    void cleanupExpiredLoginAttempts();
    setAdminSession(session);
    return {
      ok: true as const,
      user: { userId: session.userId, email: session.email, name: session.name },
    };
  });

export const logoutAdmin = createServerFn({ method: "POST" }).handler(async () => {
  clearAdminSession();
  return { ok: true as const };
});

export const getSessionAdmin = createServerFn({ method: "GET" }).handler(async () => {
  return getAdminSession();
});
