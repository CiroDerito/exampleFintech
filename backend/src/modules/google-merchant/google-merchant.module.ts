import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleMerchantService } from './google-merchant.service';
import { GoogleMerchantController } from './google-merchant.controller';
import { GoogleMerchant } from './entities/google-merchant.entity';
import { User } from '../users/entities/user.entity';
import { GcsService } from 'src/gcs/gcs.service';

@Module({
  imports: [TypeOrmModule.forFeature([GoogleMerchant, User])],
  controllers: [GoogleMerchantController],
  providers: [GoogleMerchantService, GcsService],
  exports: [GoogleMerchantService],
})
export class GoogleMerchantModule {}
