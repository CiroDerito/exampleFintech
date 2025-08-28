import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @Transform(({ obj }) => obj?.refresh_token ?? obj?.refreshToken)
  refresh_token: string;
}