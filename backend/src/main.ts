import { NestFactory } from '@nestjs/core';
import morgan from 'morgan';
import { AppModule } from './app.module';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as Sentry from '@sentry/node';
import '@sentry/tracing';

import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';


dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(morgan('dev'));
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, // Para transformar el body al DTO correcto
    }),
  );
  // Swagger config
  const config = new DocumentBuilder()
    .setTitle('Fintech API')
    .setDescription('Documentación de la API de exampleFintech')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
