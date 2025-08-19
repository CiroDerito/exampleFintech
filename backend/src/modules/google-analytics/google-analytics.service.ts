import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleAnalytics } from './entities/google-analytics.entity';
import { SaveGoogleAnalyticsDto } from './dto/save-google-analytics.dto';

@Injectable()
export class GoogleAnalyticsService {
  constructor(
    @InjectRepository(GoogleAnalytics)
    private readonly googleAnalyticsRepo: Repository<GoogleAnalytics>,
  ) {}

  async saveData(dto: SaveGoogleAnalyticsDto): Promise<GoogleAnalytics> {
    const user = await this.googleAnalyticsRepo.manager.findOne('User', { where: { id: String(dto.userId) } });
    if (!user) throw new Error('User not found');
    const entity = this.googleAnalyticsRepo.create({ user: user, data: dto.data });
    return this.googleAnalyticsRepo.save(entity);
  }
}
