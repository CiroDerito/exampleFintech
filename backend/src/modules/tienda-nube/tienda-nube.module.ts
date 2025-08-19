import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TiendaNubeController } from './tienda-nube.controller';
import { TiendaNubeService } from './tienda-nube.service';
import { TiendaNube } from './entities/tienda-nube.entity';
import { User } from '../users/entities/user.entity';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
  TypeOrmModule.forFeature([TiendaNube, User]),
    HttpModule,
  ],
  controllers: [TiendaNubeController],
  providers: [TiendaNubeService],
})
export class TiendaNubeModule {}
