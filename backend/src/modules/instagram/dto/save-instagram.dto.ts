import { IsNotEmpty, IsObject } from 'class-validator';

export class SaveInstagramDto {
  @IsNotEmpty()
  userId: number;

  @IsObject()
  data: any;
}
