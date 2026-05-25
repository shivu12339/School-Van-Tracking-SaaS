import { Logger, RequestMethod, VersioningType } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AppValidationPipe } from './common/pipes/app-validation.pipe';
import { createWinstonLogger } from './common/utils/logger.util';
import { initSentry } from './config/sentry.init';
import { initOpenTelemetry } from './core/telemetry/otel.init';
import { setupSwagger } from './config/swagger.config';
import { PrismaService } from './prisma/prisma.service';
import { RedisIoAdapter } from './tracking/adapters/redis-io.adapter';

export async function bootstrap(): Promise<void> {
  initSentry();
  initOpenTelemetry();

  const app = await NestFactory.create(AppModule, {
    logger: createWinstonLogger(),
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: configService.get<string>('app.bodyLimit', '256kb') }));
  app.use(express.urlencoded({ extended: true, limit: configService.get<string>('app.bodyLimit', '256kb') }));

  const corsOrigins = configService.get<string[]>('app.corsOrigins', []);
  app.enableCors({
    origin: corsOrigins.length === 1 && corsOrigins[0] === '*' ? true : corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.setGlobalPrefix(configService.get<string>('app.prefix', 'api'), {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });
  app.useGlobalPipes(new AppValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(
    new RequestLoggingInterceptor(),
    new ResponseInterceptor(app.get(Reflector)),
  );

  if (configService.get<string>('app.nodeEnv') !== 'production') {
    setupSwagger(app);
  } else {
    logger.log('Swagger disabled in production');
  }

  const processRole = configService.get<string>('app.processRole', 'all');
  let redisIoAdapter: RedisIoAdapter | null = null;
  if (processRole !== 'worker') {
    redisIoAdapter = new RedisIoAdapter(app, configService);
    // Tolerant: connectToRedis logs a warning and falls back to the in-memory
    // adapter if Upstash is briefly unreachable. Bootstrap MUST NOT block
    // forever here - Railway healthcheck needs the port bound within 60s.
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);
  }

  const prisma = app.get(PrismaService);
  prisma.enableShutdownHooks(app);

  const port = configService.get<number>('app.port', 4000);
  // Bind to 0.0.0.0 so Railway's edge can reach the container.
  await app.listen(port, '0.0.0.0');

  logger.log(`API listening on http://0.0.0.0:${port}/${configService.get('app.prefix')}/v1`);
  logger.log(`Environment: ${configService.get('app.nodeEnv')}`);
  logger.log(`Process role: ${processRole}`);
}
