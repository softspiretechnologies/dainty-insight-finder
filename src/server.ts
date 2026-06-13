import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import {
  logDatabaseCheck,
  logRequestFailure,
  logStartupDiagnostics,
  prodLog,
  installProcessErrorLogging,
} from "./lib/production-log.server";

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
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  prodLog("ERROR", "SSR returned unhandled HTTPError", { bodyPreview: body.slice(0, 500) });
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

let diagnosticsStarted = false;

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    if (!diagnosticsStarted) {
      diagnosticsStarted = true;
      installProcessErrorLogging();
      logStartupDiagnostics("src/server.ts");
      void logDatabaseCheck();
    }

    const { method } = request;
    const url = request.url;

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      if (normalized.status >= 500) {
        prodLog("ERROR", "Response status >= 500", { method, url, status: normalized.status });
      }
      return normalized;
    } catch (error) {
      logRequestFailure(method, url, error, "server.fetch");
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
