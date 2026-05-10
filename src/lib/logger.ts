type LogLevel = "ERROR" | "WARN" | "INFO" | "DEBUG";

function log(level: LogLevel, msg: string, meta?: Record<string, unknown>) {
  if (level === "DEBUG" && process.env.NODE_ENV !== "development") return;
  const entry = JSON.stringify({ lvl: level, msg, meta, ts: new Date().toISOString() });
  if (level === "ERROR") console.error(entry);
  else if (level === "WARN") console.warn(entry);
  else console.log(entry);
}

export const logger = {
  error: (msg: string, meta?: Record<string, unknown>) => log("ERROR", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log("WARN", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log("INFO", msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) => log("DEBUG", msg, meta),
};
