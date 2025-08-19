import { IsNotEmpty, IsObject } from 'class-validator';

export class SaveGoogleAdsDto {
  @IsNotEmpty()
  userId: number;

  @IsObject()
  data: any;
}
