import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MetaAds } from './entities/meta-ads.entity';
import { SaveMetaAdsDto } from './dto/save-meta-ads.dto';

@Injectable()
export class MetaAdsService {
  constructor(
    @InjectRepository(MetaAds)
    private readonly metaAdsRepo: Repository<MetaAds>,
  ) {}

  async saveData(dto: SaveMetaAdsDto): Promise<MetaAds> {
    const user = await this.metaAdsRepo.manager.findOne('User', { where: { id: String(dto.userId) } });
    if (!user) throw new Error('User not found');
    const entity = this.metaAdsRepo.create({ user: user, data: dto.data });
    return this.metaAdsRepo.save(entity);
  }
}
