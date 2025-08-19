import { IsNotEmpty, IsObject } from 'class-validator';

export class SaveTiendaNubeDto {
  @IsNotEmpty()
  userId: number;

  @IsObject()
  data: any;
}
