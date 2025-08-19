import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleAds } from './entities/google-ads.entity';
import { SaveGoogleAdsDto } from './dto/save-google-ads.dto';

@Injectable()
export class GoogleAdsService {
  constructor(
    @InjectRepository(GoogleAds)
    private readonly googleAdsRepo: Repository<GoogleAds>,
  ) {}

  async saveData(dto: SaveGoogleAdsDto): Promise<GoogleAds> {
    const user = await this.googleAdsRepo.manager.findOne('User', { where: { id: String(dto.userId) } });
    if (!user) throw new Error('User not found');
    const entity = this.googleAdsRepo.create({ user: user, data: dto.data });
    return this.googleAdsRepo.save(entity);
  }
}
