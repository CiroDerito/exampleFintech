import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Score } from './entities/score.entity';
import { User } from '../users/entities/user.entity';
import { Credit } from '../credit/entities/credit.entity';
import { ScoreService } from './score.service';
import { ScoreController } from './score.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Score, User, Credit])],
  controllers: [ScoreController],
  providers: [ScoreService],
  exports: [ScoreService, TypeOrmModule],
})
export class ScoreModule {}
