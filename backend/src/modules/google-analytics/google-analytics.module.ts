import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { GcsService } from 'src/gcs/gcs.service';
import { GaAnalytics } from './entities/google-analytics.entity';
import { GaAnalyticsService } from './google-analytics.service';
import { GaAnalyticsController } from './google-analytics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GaAnalytics, User])],
  providers: [GaAnalyticsService, GcsService],
  controllers: [GaAnalyticsController],
  exports: [GaAnalyticsService],
})
export class GaAnalyticsModule {}
