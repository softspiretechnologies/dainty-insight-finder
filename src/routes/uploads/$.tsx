import { createFileRoute } from "@tanstack/react-router";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { resolveUploadFile } from "@/lib/uploads.server";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function contentTypeFor(filePath: string) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

export const Route = createFileRoute("/uploads/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const relative = params._splat?.replace(/^\/+/, "");
        if (!relative || relative.includes("..")) {
          return new Response("Not found", { status: 404 });
        }

        const filePath = resolveUploadFile(relative);
        if (!filePath) {
          return new Response("Not found", { status: 404 });
        }

        try {
          const body = await readFile(filePath);
          return new Response(body, {
            headers: {
              "Content-Type": contentTypeFor(filePath),
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        } catch {
          return new Response("Not found", { status: 404 });
        }
      },
    },
  },
});
