import { IsNotEmpty, IsObject } from 'class-validator';

export class SaveMetaAdsDto {
  @IsNotEmpty()
  userId: number;

  @IsObject()
  data: any;
}
