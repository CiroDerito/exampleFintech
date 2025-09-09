import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { databaseConfig } from './config/db.config';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { AuthModule } from './modules/auth/auth.module';
import { CreditModule } from './modules/credit/credit.module';
import { ScoreModule } from './modules/score/score.module';
import { AuditModule } from './modules/audit/audit.module';
import { TiendaNubeModule } from './modules/tienda-nube/tienda-nube.module';
import { MetaAdsModule } from './modules/meta-ads/meta-ads.module';
import { BcraModule } from './modules/bcra/bcra.module';
import { GaAnalyticsModule } from './modules/google-analytics/google-analytics.module';
import { GoogleMerchantModule } from './modules/google-merchant/google-merchant.module';
import { DailyUpdatesModule } from './modules/daily-updates/daily-updates.module';

// Módulo raíz de la aplicación. Importa y configura todos los módulos principales.
@Module({
  imports: [
    // Configuración global de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `${process.cwd()}/.env`,
    }),
    // Configuración del módulo de Schedule para cron jobs
    ScheduleModule.forRoot(),
    // Configuración de la base de datos con TypeORM
    TypeOrmModule.forRootAsync({
      useFactory: databaseConfig,
    }), 
    UsersModule,
    OrganizationsModule,
    AuthModule,
    CreditModule,
    ScoreModule,
    AuditModule,
    TiendaNubeModule,
    MetaAdsModule,
    BcraModule,
    GaAnalyticsModule,
    GoogleMerchantModule,
    DailyUpdatesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
