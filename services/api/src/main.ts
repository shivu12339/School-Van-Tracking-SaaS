import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { bootstrap } from './bootstrap';

const logger = new Logger('Main');

void bootstrap().catch((error: unknown) => {
  logger.error('Fatal bootstrap error', error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
