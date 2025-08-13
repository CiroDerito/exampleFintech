import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Credit } from './entities/credit.entity';
import { User } from '../users/entities/user.entity';
import { Score } from '../score/entities/score.entity';
import { CreditService } from './credit.service';
import { CreditController } from './credit.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Credit, User, Score])],
  controllers: [CreditController],
  providers: [CreditService],
  exports: [CreditService, TypeOrmModule],
})
export class CreditModule {}
