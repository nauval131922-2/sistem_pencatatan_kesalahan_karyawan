/**
 * Simple structured logger for development
 * In production, logs are minimal to avoid sensitive data leakage
 */

const LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

type LogLevel = keyof typeof LEVELS;

const isDevelopment = process.env.NODE_ENV === 'development';
const currentLevel = isDevelopment ? LEVELS.DEBUG : LEVELS.ERROR;

// ANSI color codes for terminal output
const COLORS: Record<LogLevel, (msg: string) => string> = {
  DEBUG: (msg) => `\x1b[36m${msg}\x1b[0m`, // Cyan
  INFO: (msg) => `\x1b[32m${msg}\x1b[0m`,  // Green
  WARN: (msg) => `\x1b[33m${msg}\x1b[0m`,  // Yellow
  ERROR: (msg) => `\x1b[31m${msg}\x1b[0m`, // Red
};

const ICONS: Record<LogLevel, string> = {
  DEBUG: '🐛',
  INFO: 'ℹ️',
  WARN: '⚠️',
  ERROR: '❌',
};

function formatMessage(level: LogLevel, message: string, meta?: any): string {
  const timestamp = new Date().toISOString();
  const icon = ICONS[level];
  const colorized = COLORS[level](message);
  const metaStr = meta ? JSON.stringify(meta, null, 2) : '';

  return `[${timestamp}] ${icon} ${colorMessage(level, message)} ${metaStr}`.trim();
}

function colorMessage(level: LogLevel, message: string): string {
  if (!isDevelopment) return message;
  return COLORS[level](message);
}

/**
 * Logger instance with methods for each level
 */
export const logger = {
  debug: (message: string, meta?: any) => {
    if (currentLevel <= LEVELS.DEBUG) {
      console.debug(formatMessage('DEBUG', message, meta));
    }
  },

  info: (message: string, meta?: any) => {
    if (currentLevel <= LEVELS.INFO) {
      console.info(formatMessage('INFO', message, meta));
    }
  },

  warn: (message: string, meta?: any) => {
    if (currentLevel <= LEVELS.WARN) {
      console.warn(formatMessage('WARN', message, meta));
    }
  },

  error: (message: string, error?: Error | any, meta?: any) => {
    if (currentLevel <= LEVELS.ERROR) {
      const errorDetails = error ? { error: error.message, stack: error.stack } : null;
      console.error(formatMessage('ERROR', message, { ...errorDetails, ...meta }));
    }
  },

  // Helper for API request logging
  request: (method: string, path: string, status: number, duration: number, meta?: any) => {
    if (currentLevel <= LEVELS.INFO) {
      const statusColor = status >= 400 ? '\x1b[31m' : status >= 300 ? '\x1b[33m' : '\x1b[32m';
      const reset = '\x1b[0m';
      console.info(
        `${method} ${path} - ${statusColor}${status}${reset} (${duration}ms)`,
        meta || ''
      );
    }
  },

  // Helper for database query logging (dev only)
  query: (sql: string, params: any[], duration: number) => {
    if (currentLevel <= LEVELS.DEBUG && isDevelopment) {
      const shortSql = sql.replace(/\s+/g, ' ').trim().substring(0, 100);
      console.debug(`🗄️  DB Query (${duration}ms): ${shortSql}...`, { params });
    }
  },
};

/**
 * Safe error formatter for logging
 */
export function formatError(err: any): string {
  if (err instanceof Error) {
    return `${err.name}: ${err.message}${err.stack ? `\n${err.stack}` : ''}`;
  }
  return typeof err === 'string' ? err : JSON.stringify(err);
}

export default logger;
