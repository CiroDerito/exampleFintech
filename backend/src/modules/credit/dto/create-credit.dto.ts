import { IsUUID, IsNumber } from 'class-validator';

export class CreateCreditDto {
  @IsUUID()
  userId: string;

  @IsNumber()
  amount: number;
}
