// bcra/dto/consulta-bcra.dto.ts
import { IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class ConsultaBcraDto {
  @IsString()
  @Transform(({ value }) => String(value).replace(/\D/g, ''))
  @Matches(/^\d{11}$/, { message: 'El CUIT/CUIL debe tener exactamente 11 dígitos' })
  cuitOrCuil!: string;
}
