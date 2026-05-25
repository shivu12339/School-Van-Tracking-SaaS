import { type INestApplication, VersioningType } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { AppValidationPipe } from '../../src/common/pipes/app-validation.pipe';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(new AppValidationPipe());
  await app.init();
  return app;
}
