import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { databaseConfig } from './config/db.config';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { AuthModule } from './modules/auth/auth.module';
import { CreditModule } from './modules/credit/credit.module';
import { IntegrationDataModule } from './modules/integration-data/integration-data.module';
import { ScoreModule } from './modules/score/score.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
        envFilePath: `${process.cwd()}/.env`,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: databaseConfig,
    }),
  UsersModule,
  OrganizationsModule,
  AuthModule,
  CreditModule,
  IntegrationDataModule,
  ScoreModule,
  AuditModule,
  ],
})
export class AppModule {}
