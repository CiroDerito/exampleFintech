import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyUpdatesService } from './daily-updates.service';
import { DailyUpdatesController } from './daily-updates.controller';
import { User } from '../users/entities/user.entity';
import { MetaAdsModule } from '../meta-ads/meta-ads.module';
import { TiendaNubeModule } from '../tienda-nube/tienda-nube.module';
import { GaAnalyticsModule } from '../google-analytics/google-analytics.module';
import { GoogleMerchantModule } from '../google-merchant/google-merchant.module';
import { BcraModule } from '../bcra/bcra.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    MetaAdsModule,
    TiendaNubeModule,
    GaAnalyticsModule,
    GoogleMerchantModule,
    BcraModule,
  ],
  controllers: [DailyUpdatesController],
  providers: [DailyUpdatesService],
  exports: [DailyUpdatesService],
})
export class DailyUpdatesModule {}
