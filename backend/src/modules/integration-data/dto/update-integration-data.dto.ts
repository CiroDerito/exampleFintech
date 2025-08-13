// DTO para actualizar un registro de IntegrationData
import { PartialType } from '@nestjs/mapped-types';
import { CreateIntegrationDataDto } from './create-integration-data.dto';

export class UpdateIntegrationDataDto extends PartialType(CreateIntegrationDataDto) {}
