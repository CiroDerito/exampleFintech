import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as Sentry from '@sentry/node';
import '@sentry/tracing';
import { ValidationPipe } from '@nestjs/common';


dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
