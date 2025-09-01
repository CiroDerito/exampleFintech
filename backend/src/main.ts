
// Archivo principal de arranque de la aplicación NestJS
// Configura middlewares globales, Sentry, CORS, rate limiting y Swagger
import { NestFactory } from '@nestjs/core';
import { DateFormatInterceptor } from './common/interceptors/date-format.interceptor';
import morgan from 'morgan';
import { AppModule } from './app.module';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as Sentry from '@sentry/node';
import '@sentry/tracing';
import * as rateLimit from 'express-rate-limit';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new DateFormatInterceptor());

  app.use(morgan('dev'));

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  });

  app.enableCors({
    origin: [/^https?:\/\/localhost(:\d+)?$/, /tudominio\.com$/],
    credentials: true,
  });


  app.use(
    rateLimit.default({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, 
    }),
  );
  // Swagger config
  const config = new DocumentBuilder()
    .setTitle('Fintech API')
    .setDescription('Documentación de la API de Loopi')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT || 3001);
}
console.log('GCS_BUCKET =', process.env.GCS_BUCKET);
const mode =
  process.env.GOOGLE_APPLICATION_CREDENTIALS_B64 ? `b64(len=${process.env.GOOGLE_APPLICATION_CREDENTIALS_B64.length})` :
  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ? 'inline' :
  process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'file' : 'ADC';
console.log('GCP Cred Mode =', mode);

bootstrap();
