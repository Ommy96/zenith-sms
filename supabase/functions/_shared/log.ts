// Structured JSON logger for edge functions.
type Level = "info" | "warn" | "error";

export interface LogContext {
  fn: string;
  requestId?: string;
  tenantId?: string | null;
  [k: string]: unknown;
}

function emit(level: Level, ctx: LogContext, msg: string, extra?: Record<string, unknown>) {
  const entry = { level, msg, ts: new Date().toISOString(), ...ctx, ...(extra ?? {}) };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export function createLogger(ctx: LogContext) {
  return {
    info: (msg: string, extra?: Record<string, unknown>) => emit("info", ctx, msg, extra),
    warn: (msg: string, extra?: Record<string, unknown>) => emit("warn", ctx, msg, extra),
    error: (msg: string, extra?: Record<string, unknown>) => emit("error", ctx, msg, extra),
    child: (more: Partial<LogContext>) => createLogger({ ...ctx, ...more }),
  };
}

export const log = {
  info: (fn: string, msg: string, extra?: Record<string, unknown>) => emit("info", { fn }, msg, extra),
  warn: (fn: string, msg: string, extra?: Record<string, unknown>) => emit("warn", { fn }, msg, extra),
  error: (fn: string, msg: string, extra?: Record<string, unknown>) => emit("error", { fn }, msg, extra),
};