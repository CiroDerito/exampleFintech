import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Instagram } from './entities/instagram.entity';
import { SaveInstagramDto } from './dto/save-instagram.dto';

@Injectable()
export class InstagramService {
  constructor(
    @InjectRepository(Instagram)
    private readonly instagramRepo: Repository<Instagram>,
  ) {}

  async saveData(dto: SaveInstagramDto): Promise<Instagram> {
    const user = await this.instagramRepo.manager.findOne('User', { where: { id: String(dto.userId) } });
    if (!user) throw new Error('User not found');
    const entity = this.instagramRepo.create({ user: user, data: dto.data });
    return this.instagramRepo.save(entity);
  }
}
