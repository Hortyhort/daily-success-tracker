type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

const isDev = process.env.NODE_ENV === "development";

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

export const logger = {
  debug(message: string, context?: LogContext) {
    if (isDev) {
      console.debug(formatMessage("debug", message, context));
    }
  },

  info(message: string, context?: LogContext) {
    console.info(formatMessage("info", message, context));
  },

  warn(message: string, context?: LogContext) {
    console.warn(formatMessage("warn", message, context));
  },

  error(message: string, error?: Error, context?: LogContext) {
    const errorContext = error
      ? { ...context, error: error.message, stack: error.stack }
      : context;
    console.error(formatMessage("error", message, errorContext));
  },

  // For API request logging
  request(method: string, path: string, duration: number, status: number) {
    const context = { duration: `${duration}ms`, status };
    if (status >= 500) {
      this.error(`${method} ${path}`, undefined, context);
    } else if (status >= 400) {
      this.warn(`${method} ${path}`, context);
    } else {
      this.info(`${method} ${path}`, context);
    }
  },
};
