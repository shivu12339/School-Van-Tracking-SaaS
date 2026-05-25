import { ValidationPipe } from '@nestjs/common';

export class AppValidationPipe extends ValidationPipe {
  constructor() {
    super({
      transform: true,
      whitelist: true,
      forbidUnknownValues: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    });
  }
}
