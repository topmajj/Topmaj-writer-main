type LogLevel = "debug" | "info" | "warn" | "error"

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// Set this to the minimum level you want to see in the console
const CURRENT_LOG_LEVEL: LogLevel = process.env.NODE_ENV === "production" ? "warn" : "debug"

export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (LOG_LEVELS[CURRENT_LOG_LEVEL] <= LOG_LEVELS.debug) {
      console.debug(`[DEBUG] ${message}`, ...args)
    }
  },

  info: (message: string, ...args: any[]) => {
    if (LOG_LEVELS[CURRENT_LOG_LEVEL] <= LOG_LEVELS.info) {
      console.info(`[INFO] ${message}`, ...args)
    }
  },

  warn: (message: string, ...args: any[]) => {
    if (LOG_LEVELS[CURRENT_LOG_LEVEL] <= LOG_LEVELS.warn) {
      console.warn(`[WARN] ${message}`, ...args)
    }
  },

  error: (message: string, ...args: any[]) => {
    if (LOG_LEVELS[CURRENT_LOG_LEVEL] <= LOG_LEVELS.error) {
      console.error(`[ERROR] ${message}`, ...args)
    }
  },
}
