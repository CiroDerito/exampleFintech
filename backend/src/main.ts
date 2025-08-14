
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


// Carga las variables de entorno desde el archivo .env
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Función principal que inicia la aplicación
async function bootstrap() {
  // Crea la instancia principal de la app usando el módulo raíz
  const app = await NestFactory.create(AppModule);

  // Interceptor global para formatear fechas a GMT-3
  app.useGlobalInterceptors(new DateFormatInterceptor());

  // Middleware para logs HTTP en consola
  app.use(morgan('dev'));

  // Inicializa Sentry para monitoreo de errores
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  });

  // Configuración de CORS para permitir solicitudes seguras desde frontend
  app.enableCors({
    origin: [/^https?:\/\/localhost(:\d+)?$/, /tudominio\.com$/],
    credentials: true,
  });

  // Limitador de tasa para evitar abuso de la API
  app.use(
    rateLimit.default({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // 100 requests por IP
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

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
