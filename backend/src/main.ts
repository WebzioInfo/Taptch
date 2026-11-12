import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment configuration
dotenv.config({ path: path.resolve('.env.local') });
dotenv.config({ path: path.resolve('.env') });

async function bootstrap() {
  const logger = new Logger('TaptchBackendBootstrap');
  const app = await NestFactory.create(AppModule);

  // Cookie parsing middleware
  app.use((req: any, _res: any, next: any) => {
    if (!req.cookies && req.headers?.cookie) {
      req.cookies = {};
      const parts = req.headers.cookie.split(';');
      for (const part of parts) {
        const [k, ...v] = part.trim().split('=');
        if (k) {
          try {
            req.cookies[k] = decodeURIComponent(v.join('='));
          } catch {
            req.cookies[k] = v.join('=');
          }
        }
      }
    } else if (!req.cookies) {
      req.cookies = {};
    }
    next();
  });

  // Global exception filter and response envelope
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Input validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );

  // CORS Configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000', 'https://taptch.com', 'https://taptch.webziotech.in'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-test-user-id', 'x-test-role', 'x-test-org-id'],
  });

  // Swagger OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('TAPTCH API')
    .setDescription('TAPTCH High-Scale NFC Digital Identity & Dynamic QR API Engine')
    .setVersion('2.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.PORT || process.env.BACKEND_PORT || 4000;
  await app.listen(port);
  logger.log(`TAPTCH NestJS Backend running on port ${port} (Swagger docs: http://localhost:${port}/api/docs)`);
}

bootstrap();

