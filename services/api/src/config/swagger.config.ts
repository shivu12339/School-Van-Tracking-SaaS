import { type INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('School Van Tracking SaaS API')
    .setDescription('Enterprise REST API for multi-tenant school transportation platform')
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token',
    )
    .addCookieAuth('svt_refresh', {
      type: 'apiKey',
      in: 'cookie',
      name: 'svt_refresh',
      description: 'HTTP-only refresh token (web clients)',
    })
    .addTag('Auth')
    .addTag('Schools')
    .addTag('Drivers')
    .addTag('Vans')
    .addTag('Students')
    .addTag('Parents')
    .addTag('Routes')
    .addTag('Users')
    .addTag('Drivers')
    .addTag('Students')
    .addTag('Trips')
    .addTag('Tracking')
    .addTag('Notifications')
    .addTag('Parent')
    .addTag('Driver')
    .addTag('Health')
    .addTag('Metrics')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
    },
  });
}
