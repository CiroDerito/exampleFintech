// DTO para crear un nuevo registro de IntegrationData
import { IsUUID, IsEnum, IsObject, IsOptional } from 'class-validator';
import { IntegrationSource } from '../entities/integration-data.entity';

export class CreateIntegrationDataDto {
  @IsUUID()
  userId: string;

  @IsEnum(IntegrationSource)
  source: IntegrationSource;

  @IsObject()
  raw_data: Record<string, any>;

  @IsObject()
  @IsOptional()
  processed_data?: Record<string, any>;
}
