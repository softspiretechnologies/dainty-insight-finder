import process from "node:process";
import { z } from "zod";

// Server-only config. The .server.ts suffix prevents Vite from bundling
// this file into the client — values here never reach the browser.
//
// On Cloudflare Workers, env binds at REQUEST time. Module-scope reads
// (e.g. `const x = process.env.X`) resolve to undefined — always read
// process.env INSIDE a function or handler.
//
// When to use which env-access pattern:
//   - .server.ts module (this file): server-only helpers reused across
//     handlers. Wrap reads in a function so they run per-request.
//   - inline process.env inside a createServerFn handler: one-off reads
//     not reused elsewhere.
//   - import.meta.env.VITE_FOO: PUBLIC config readable from both client
//     and server (analytics IDs, public URLs). Define in .env with the
//     VITE_ prefix. Never put secrets here — they ship to the browser.

const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().trim().min(1).optional(),
    ADMIN_SESSION_SECRET: z.string().trim().min(32).optional(),
    UPLOADS_DIR: z.string().trim().min(1).optional(),
    VITE_SITE_URL: z.string().trim().url().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== "production") return;
    for (const key of ["DATABASE_URL", "ADMIN_SESSION_SECRET", "VITE_SITE_URL"] as const) {
      if (!env[key]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${key} is required in production`,
        });
      }
    }
  });

export type ServerConfig = {
  nodeEnv: "development" | "test" | "production";
  databaseUrl?: string;
  adminSessionSecret?: string;
  uploadsDir?: string;
  siteUrl?: string;
};

export function parseServerConfig(env: NodeJS.ProcessEnv): ServerConfig {
  const result = serverEnvSchema.safeParse(env);
  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Invalid server configuration: ${fields}`);
  }
  return {
    nodeEnv: result.data.NODE_ENV,
    databaseUrl: result.data.DATABASE_URL,
    adminSessionSecret: result.data.ADMIN_SESSION_SECRET,
    uploadsDir: result.data.UPLOADS_DIR,
    siteUrl: result.data.VITE_SITE_URL,
  };
}

export function getServerConfig() {
  return parseServerConfig(process.env);
}
