import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SyncScoreDto {
  @ApiProperty({ 
    description: 'Email del usuario para consultar en BigQuery',
    example: 'usuario@email.com' 
  })
  @IsEmail()
  email: string;
}
