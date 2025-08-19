import { IsNotEmpty, IsObject } from 'class-validator';

export class SaveGoogleAnalyticsDto {
  @IsNotEmpty()
  userId: number;

  @IsObject()
  data: any;
}
