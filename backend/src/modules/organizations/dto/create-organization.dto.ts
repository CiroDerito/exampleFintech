import { IsString, IsOptional } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
