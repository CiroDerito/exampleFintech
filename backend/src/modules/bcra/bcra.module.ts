import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bcra } from './entities/bcra.entity';
import { BcraService } from './bcra.service';
import { BcraController } from './bcra.controller';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bcra, User])],
  providers: [BcraService],
  controllers: [BcraController],
  exports: [BcraService],
})
export class BcraModule {}
