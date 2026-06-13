import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { imageUploadPayloadSchema } from "@/lib/admin-upload-payload";
import { getAdminSession } from "@/lib/auth.server";
import { saveUploadedImageFromPayload } from "@/lib/uploads.server";

export const uploadImage = createServerFn({ method: "POST" })
  .validator(
    z.object({
      subdir: z.enum(["products", "categories"]),
      image: imageUploadPayloadSchema,
    }),
  )
  .handler(async ({ data }) => {
    const session = getAdminSession();
    if (!session) {
      throw new Error("Unauthorized");
    }

    const imagePath = await saveUploadedImageFromPayload(data.image, data.subdir);
    return { imagePath };
  });
