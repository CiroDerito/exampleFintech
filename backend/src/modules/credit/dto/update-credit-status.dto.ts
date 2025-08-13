import { IsEnum } from 'class-validator';
import { CreditStatus } from '../entities/credit.entity';

export class UpdateCreditStatusDto {
  @IsEnum(CreditStatus)
  status: CreditStatus;
}
