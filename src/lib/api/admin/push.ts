import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { adminPushSubscriptionInputSchema } from "@/lib/admin-push";
import { requireAdmin } from "@/lib/auth.server";

export const getAdminPushStatus = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { getAdminPushStatusPayload } = await import("@/lib/admin-push.server");
  return getAdminPushStatusPayload();
});

export const saveAdminPushSubscription = createServerFn({ method: "POST" })
  .validator(adminPushSubscriptionInputSchema)
  .handler(async ({ data }) => {
    const session = await requireAdmin();
    const { saveAdminPushSubscriptionForUser } = await import("@/lib/admin-push.server");
    return saveAdminPushSubscriptionForUser(session.userId, data);
  });

export const removeAdminPushSubscription = createServerFn({ method: "POST" })
  .validator(z.object({ endpoint: z.string().trim().min(1).max(4096) }))
  .handler(async ({ data }) => {
    const session = await requireAdmin();
    const { removeAdminPushSubscriptionForUser } = await import("@/lib/admin-push.server");
    return removeAdminPushSubscriptionForUser(session.userId, data.endpoint);
  });

export const sendAdminPushTest = createServerFn({ method: "POST" })
  .validator(z.object({ endpoint: z.string().trim().min(1).max(4096) }))
  .handler(async ({ data }) => {
    const session = await requireAdmin();
    const { sendAdminTestNotification } = await import("@/lib/admin-push.server");
    return sendAdminTestNotification(session.userId, data.endpoint);
  });
