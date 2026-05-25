import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { createWinstonLogger } from './common/utils/logger.util';
import { initSentry } from './config/sentry.init';
import { WorkerModule } from './worker.module';

export async function bootstrapWorker(): Promise<void> {
  initSentry();
  const app = await NestFactory.create(WorkerModule, {
    logger: createWinstonLogger(),
  });
  const configService = app.get(ConfigService);

  app.use(helmet({ contentSecurityPolicy: false }));
  const port = configService.get<number>('app.port', 4001);
  await app.listen(port);
}
