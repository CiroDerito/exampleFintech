// Módulo principal de IntegrationData
// Importa entidades y servicios necesarios, y exporta el servicio para uso en otros módulos

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationData } from './entities/integration-data.entity';
import { IntegrationDataService } from './integration-data.service';
import { IntegrationDataController } from './integration-data.controller';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IntegrationData, User])],
  providers: [IntegrationDataService],
  controllers: [IntegrationDataController],
  exports: [IntegrationDataService],
})
export class IntegrationDataModule {}
