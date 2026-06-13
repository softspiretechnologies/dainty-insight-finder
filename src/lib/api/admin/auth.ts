import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  clearAdminSession,
  getAdminSession,
  setAdminSession,
  verifyAdminCredentials,
} from "@/lib/auth.server";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const loginAdmin = createServerFn({ method: "POST" })
  .validator(loginSchema)
  .handler(async ({ data }) => {
    const session = await verifyAdminCredentials(data.email, data.password);
    if (!session) {
      return { ok: false as const, error: "Invalid email or password" };
    }

    setAdminSession(session);
    return { ok: true as const, user: session };
  });

export const logoutAdmin = createServerFn({ method: "POST" }).handler(async () => {
  clearAdminSession();
  return { ok: true as const };
});

export const getSessionAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const session = getAdminSession();
  return session;
});
