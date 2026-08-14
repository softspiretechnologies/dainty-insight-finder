import { createServerFn } from "@tanstack/react-start";

import { changePasswordSchema } from "@/lib/admin-schemas";
import {
  changeAdminPassword,
  clearAdminSession,
  incrementAdminSessionVersion,
  requireAdmin,
} from "@/lib/auth.server";
import {
  checkLoginRateLimit,
  clearLoginAttempts,
  getLoginClientIp,
  recordLoginFailure,
} from "@/lib/admin-rate-limit.server";

export const changePassword = createServerFn({ method: "POST" })
  .validator(changePasswordSchema)
  .handler(async ({ data }) => {
    const session = await requireAdmin();
    const ip = getLoginClientIp();
    const rateLimitError = await checkLoginRateLimit(ip, session.email);
    if (rateLimitError) return { ok: false as const, error: rateLimitError };
    const changed = await changeAdminPassword(
      session.userId,
      data.currentPassword,
      data.newPassword,
    );
    if (!changed) {
      await recordLoginFailure(ip, session.email);
      return { ok: false as const, error: "Current password is incorrect" };
    }
    await clearLoginAttempts(ip, session.email);
    clearAdminSession();
    return { ok: true as const };
  });

export const logoutAllAdminSessions = createServerFn({ method: "POST" }).handler(async () => {
  const session = await requireAdmin();
  await incrementAdminSessionVersion(session.userId);
  clearAdminSession();
  return { ok: true as const };
});
