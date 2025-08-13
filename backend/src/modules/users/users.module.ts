import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { Credit } from '../credit/entities/credit.entity';
import { Score } from '../score/entities/score.entity';
import { IntegrationData } from '../integration-data/entities/integration-data.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Credit, Score, IntegrationData])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule { }
