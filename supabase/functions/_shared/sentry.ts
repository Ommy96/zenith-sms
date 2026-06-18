// Lightweight Sentry transport for Deno edge functions via the Store endpoint.
// Set EDGE_SENTRY_DSN to enable. No-op when unset.
import { createLogger, LogContext } from "./log.ts";

const DSN = Deno.env.get("EDGE_SENTRY_DSN") ?? "";

function parseDsn(dsn: string) {
  try {
    const u = new URL(dsn);
    return {
      projectId: u.pathname.replace(/^\//, ""),
      publicKey: u.username,
      host: u.host,
      protocol: u.protocol.replace(":", ""),
    };
  } catch {
    return null;
  }
}

const parsed = DSN ? parseDsn(DSN) : null;

async function sendEvent(event: Record<string, unknown>) {
  if (!parsed) return;
  const url = `${parsed.protocol}://${parsed.host}/api/${parsed.projectId}/store/`;
  const auth = `Sentry sentry_version=7, sentry_key=${parsed.publicKey}, sentry_client=zenith-edge/1.0`;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Sentry-Auth": auth },
      body: JSON.stringify(event),
    });
  } catch { /* swallow telemetry errors */ }
}

export async function captureEdgeException(err: unknown, ctx: LogContext) {
  const message = err instanceof Error ? err.message : String(err);
  await sendEvent({
    event_id: crypto.randomUUID().replace(/-/g, ""),
    timestamp: new Date().toISOString(),
    platform: "javascript",
    level: "error",
    logger: ctx.fn,
    tags: { fn: ctx.fn, tenant_id: ctx.tenantId ?? undefined },
    extra: ctx,
    message,
    exception: {
      values: [{
        type: err instanceof Error ? err.name : "Error",
        value: message,
        stacktrace: err instanceof Error && err.stack
          ? { frames: [{ filename: ctx.fn, function: "handler", context_line: err.stack.split("\n")[0] }] }
          : undefined,
      }],
    },
  });
}

/**
 * Wraps a Deno.serve handler so uncaught errors are captured to Sentry and
 * emitted as structured JSON logs. Always returns a Response.
 */
export function withSentry(fn: string, handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
    const log = createLogger({ fn, requestId });
    try {
      return await handler(req);
    } catch (err) {
      log.error("unhandled_error", { err: err instanceof Error ? err.message : String(err) });
      await captureEdgeException(err, { fn, requestId });
      return new Response(JSON.stringify({ error: "Internal Server Error", requestId }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  };
}