export interface Logger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: unknown, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
}

class SystemLogger implements Logger {
  private format(level: string, message: string, context?: Record<string, unknown>) {
    const timestamp = new Date().toISOString();
    const ctx = context ? ` ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${ctx}`;
  }

  info(message: string, context?: Record<string, unknown>): void {
    console.log(this.format("info", message, context));
  }

  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(this.format("warn", message, context));
  }

  error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    const errDetails = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error;
    console.error(this.format("error", message, { ...context, error: errDetails }));
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== "production") {
      console.debug(this.format("debug", message, context));
    }
  }
}

export const logger = new SystemLogger();
