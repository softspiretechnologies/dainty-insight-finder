import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { loginSchema } from "@/lib/admin-schemas";
import {
  checkLoginRateLimit,
  clearLoginAttempts,
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
    const rateLimitError = checkLoginRateLimit(data.email);
    if (rateLimitError) {
      return { ok: false as const, error: rateLimitError };
    }

    const session = await verifyAdminCredentials(data.email, data.password);
    if (!session) {
      recordLoginFailure(data.email);
      return { ok: false as const, error: "Invalid email or password" };
    }

    clearLoginAttempts(data.email);
    setAdminSession(session);
    return { ok: true as const, user: session };
  });

export const logoutAdmin = createServerFn({ method: "POST" }).handler(async () => {
  clearAdminSession();
  return { ok: true as const };
});

export const getSessionAdmin = createServerFn({ method: "GET" }).handler(async () => {
  return getAdminSession();
});
