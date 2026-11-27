import { renderErrorPage } from "./lib/error-page";
import { getServerConfig } from "./lib/config.server";
import { getCanonicalRedirect } from "./lib/canonical-redirect";
import { createErrorId, logError } from "./lib/logger.server";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(
  request: Request,
  response: Response,
): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  const errorId = createErrorId();
  logError("server.catastrophic_ssr_response", new Error("Unhandled SSR HTTPError"), {
    errorId,
    route: new URL(request.url).pathname,
    status: response.status,
  });
  return new Response(renderErrorPage(errorId), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function withSecurityHeaders(request: Request, response: Response) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set(
    "Content-Security-Policy-Report-Only",
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com; frame-src 'self' https://www.googletagmanager.com",
  );
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (new URL(request.url).protocol === "https:" || forwardedProto === "https") {
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const config = getServerConfig();
      const redirect = getCanonicalRedirect(
        request,
        config.siteUrl,
        config.nodeEnv === "production",
      );
      if (redirect) return withSecurityHeaders(request, redirect);
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return withSecurityHeaders(
        request,
        await normalizeCatastrophicSsrResponse(request, response),
      );
    } catch (error) {
      const errorId = createErrorId();
      logError("server.unexpected_failure", error, {
        errorId,
        route: new URL(request.url).pathname,
      });
      return withSecurityHeaders(
        request,
        new Response(renderErrorPage(errorId), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      );
    }
  },
};
