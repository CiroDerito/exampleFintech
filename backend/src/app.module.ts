import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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

// Módulo raíz de la aplicación. Importa y configura todos los módulos principales.
@Module({
  imports: [
    // Configuración global de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `${process.cwd()}/.env`,
    }),
    // Configuración de la base de datos con TypeORM
    TypeOrmModule.forRootAsync({
      useFactory: databaseConfig,
    }),
    // Importa los módulos funcionales
    UsersModule,
    OrganizationsModule,
    AuthModule,
    CreditModule,
    ScoreModule,
    AuditModule,
  TiendaNubeModule,
  MetaAdsModule,
  ],
    controllers: [],
    providers: [],
})
export class AppModule {}
 