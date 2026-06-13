import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getAdminSession } from "@/lib/auth.server";
import { saveUploadedImage } from "@/lib/uploads.server";

const formDataSchema = z.custom<FormData>((value) => value instanceof FormData, {
  message: "Expected FormData",
});

export const uploadImage = createServerFn({ method: "POST" })
  .validator(formDataSchema)
  .handler(async ({ data: formData }) => {
    const session = getAdminSession();
    if (!session) {
      throw new Error("Unauthorized");
    }

    const file = formData.get("file");
    const subdir = formData.get("subdir");

    if (!(file instanceof File)) {
      throw new Error("No file provided");
    }
    if (subdir !== "products" && subdir !== "categories") {
      throw new Error("Invalid upload target");
    }

    const imagePath = await saveUploadedImage(file, subdir);
    return { imagePath };
  });
