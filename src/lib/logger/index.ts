import pino, { type Logger, type LoggerOptions } from 'pino';

declare global {
  var __tapzio_logger__: Logger | undefined;
}

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : isTest ? 'warn' : 'debug');

function initRawLogger(): Logger {
  const options: LoggerOptions = {
    level: logLevel,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'password',
        'activationCode',
        'code',
        'token',
        'secret',
        'apiKey',
      ],
      censor: '[REDACTED]',
    },
    base: {
      env: process.env.NODE_ENV || 'development',
      service: 'tapzio-api',
    },
    // We intentionally avoid pino.transport({ target: 'pino-pretty' }) here because
    // thread-stream worker threads fail under Next.js Webpack bundling (.next/server/vendor-chunks/lib/worker.js)
    // and crash on route compilation / hot reload.
  };

  return pino(options);
}

const rawLogger: Logger =
  globalThis.__tapzio_logger__ || (globalThis.__tapzio_logger__ = initRawLogger());

/**
 * Crash-Proof Logging Dispatcher
 *
 * Ensures that logging failures (worker thread termination, I/O errors, stream closures)
 * NEVER propagate as uncaught exceptions into business operations or crash the Node.js process.
 */
function safeLog(level: 'info' | 'warn' | 'error' | 'debug' | 'trace' | 'fatal', ...args: unknown[]) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (rawLogger as any)[level](...args);
  } catch {
    const consoleMethod =
      level === 'error' || level === 'fatal' ? 'error' : level === 'warn' ? 'warn' : 'log';
    // Fallback directly to console so diagnostic telemetry is preserved without crashing
    console[consoleMethod](`[LOGGER-FALLBACK-${level.toUpperCase()}]`, ...args);
  }
}

export const logger = {
  info: (...args: Parameters<Logger['info']>) => safeLog('info', ...args),
  warn: (...args: Parameters<Logger['warn']>) => safeLog('warn', ...args),
  error: (...args: Parameters<Logger['error']>) => safeLog('error', ...args),
  debug: (...args: Parameters<Logger['debug']>) => safeLog('debug', ...args),
  trace: (...args: Parameters<Logger['trace']>) => safeLog('trace', ...args),
  fatal: (...args: Parameters<Logger['fatal']>) => safeLog('fatal', ...args),
  child: (bindings: Record<string, unknown>) => {
    try {
      return rawLogger.child(bindings);
    } catch {
      return logger;
    }
  },
  get level() {
    return rawLogger.level;
  },
  set level(newLevel: string) {
    rawLogger.level = newLevel;
  },
} as unknown as Logger;

export function createRequestLogger(requestId: string, extra: Record<string, unknown> = {}) {
  try {
    return rawLogger.child({ requestId, ...extra });
  } catch {
    return logger;
  }
}
