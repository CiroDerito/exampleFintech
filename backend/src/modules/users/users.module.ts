import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Credit } from '../credit/entities/credit.entity';
import { Score } from '../score/entities/score.entity';
import { AuditModule } from '../audit/audit.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

import { BcraModule } from '../bcra/bcra.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Credit, Score]), AuditModule, BcraModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule { }
