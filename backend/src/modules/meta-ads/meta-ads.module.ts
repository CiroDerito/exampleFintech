import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetaAds } from './entities/meta-ads.entity';
import { MetaAdsService } from './meta-ads.service';
import { MetaAdsController } from './meta-ads.controller';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MetaAds, User])],
  providers: [MetaAdsService],
  controllers: [MetaAdsController],
  exports: [MetaAdsService],
})
export class MetaAdsModule {}
