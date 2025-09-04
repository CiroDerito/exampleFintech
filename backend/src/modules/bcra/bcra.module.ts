import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bcra } from './entities/bcra.entity';
import { BcraService } from './bcra.service';
import { BcraController } from './bcra.controller';
import { User } from '../users/entities/user.entity';
import { GcsService } from 'src/gcs/gcs.service';

@Module({
  imports: [TypeOrmModule.forFeature([Bcra, User])],
  providers: [BcraService, GcsService],
  controllers: [BcraController],
  exports: [BcraService],
})
export class BcraModule {}
