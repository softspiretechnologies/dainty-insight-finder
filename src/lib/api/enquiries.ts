import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Thin RPC wrapper only. Keep server imports out of this module so the client
 * createServerFn stub cannot pull Drizzle/web-push into the browser bundle.
 */
export const submitEnquiry = createServerFn({ method: "POST" })
  .validator(z.unknown())
  .handler(async ({ data }) => {
    const { submitEnquiryCore } = await import("@/lib/enquiries.server");
    return submitEnquiryCore(data);
  });
