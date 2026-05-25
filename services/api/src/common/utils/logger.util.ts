import { mkdirSync } from 'node:fs';
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

export function createWinstonLogger() {
  const isProduction = process.env.NODE_ENV === 'production';

  try {
    mkdirSync(join(process.cwd(), 'logs'), { recursive: true });
  } catch {
    /* ignore — Winston may still use console only */
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
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.json(),
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.json(),
      }),
    ],
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
