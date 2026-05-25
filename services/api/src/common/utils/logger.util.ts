import { accessSync, constants as fsConstants, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { REQUEST_ID_HEADER } from '../constants/app.constants';

const correlationFormat = winston.format((info) => {
  if (info.requestId) {
    info.message = `[${info.requestId}] ${info.message}`;
  }
  return info;
});

/**
 * Resolve a writable logs directory. Returns null when the filesystem is
 * read-only or the process lacks write permission, so File transports can
 * be skipped instead of crashing the app at boot (e.g. on Railway / Fly /
 * non-root containers, or when WRITE_LOG_FILES=false is set explicitly).
 */
function resolveLogsDir(): string | null {
  if (process.env.WRITE_LOG_FILES === 'false') return null;
  const dir = join(process.cwd(), 'logs');
  try {
    mkdirSync(dir, { recursive: true });
    accessSync(dir, fsConstants.W_OK);
    return dir;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // eslint-disable-next-line no-console
    console.warn(`[logger] file logging disabled: ${message}`);
    return null;
  }
}

export function createWinstonLogger() {
  const isProduction = process.env.NODE_ENV === 'production';
  const logsDir = resolveLogsDir();

  const transports: winston.transport[] = [new winston.transports.Console()];

  if (logsDir) {
    transports.push(
      new winston.transports.File({
        filename: join(logsDir, 'error.log'),
        level: 'error',
        format: winston.format.json(),
      }),
      new winston.transports.File({
        filename: join(logsDir, 'combined.log'),
        format: winston.format.json(),
      }),
    );
  }

  return WinstonModule.createLogger({
    level: isProduction ? 'info' : 'debug',
    defaultMeta: { service: 'schoolvan-api' },
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      correlationFormat(),
      isProduction
        ? winston.format.json()
        : winston.format.combine(winston.format.colorize(), winston.format.simple()),
    ),
    transports,
  });
}

/** Attach correlation id to Winston child loggers from HTTP context */
export function logWithRequestId(
  logger: winston.Logger,
  requestId: string | undefined,
  level: 'info' | 'warn' | 'error',
  message: string,
  meta?: Record<string, unknown>,
): void {
  logger.log(level, message, { requestId: requestId ?? 'n/a', ...meta });
}

export { REQUEST_ID_HEADER };
