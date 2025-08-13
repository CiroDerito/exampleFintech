import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async log(userId: string, action: string, details?: Record<string, any>) {
    const log = this.auditRepository.create({ userId, action, details });
    await this.auditRepository.save(log);
  }

  async findAll() {
    return this.auditRepository.find({ order: { createdAt: 'DESC' } });
  }
}
