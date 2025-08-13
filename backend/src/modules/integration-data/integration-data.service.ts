// Servicio para manejar la lógica de negocio de IntegrationData
// Permite crear, actualizar, obtener y listar datos de integraciones externas

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntegrationData, IntegrationSource } from './entities/integration-data.entity';
import { CreateIntegrationDataDto } from './dto/create-integration-data.dto';
import { UpdateIntegrationDataDto } from './dto/update-integration-data.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class IntegrationDataService {
  constructor(
    @InjectRepository(IntegrationData)
    private readonly integrationDataRepository: Repository<IntegrationData>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Crear un nuevo registro de IntegrationData
  async create(dto: CreateIntegrationDataDto): Promise<IntegrationData> {
    const user = await this.userRepository.findOneBy({ id: dto.userId });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const integrationData = this.integrationDataRepository.create({
      ...dto,
      user,
    });
    return this.integrationDataRepository.save(integrationData);
  }

  // Listar todos los registros (opcional: filtrar por usuario o fuente)
  async findAll(userId?: string, source?: IntegrationSource): Promise<IntegrationData[]> {
    const where: any = {};
    if (userId) where.user = { id: userId };
    if (source) where.source = source;
    return this.integrationDataRepository.find({ where, relations: ['user'] });
  }

  // Obtener un registro por ID
  async findOne(id: string): Promise<IntegrationData | null> {
    return this.integrationDataRepository.findOne({ where: { id }, relations: ['user'] });
  }

  // Actualizar un registro
  async update(id: string, dto: UpdateIntegrationDataDto): Promise<IntegrationData> {
    const integrationData = await this.integrationDataRepository.findOneBy({ id });
    if (!integrationData) throw new NotFoundException('IntegrationData no encontrado');
    Object.assign(integrationData, dto);
    return this.integrationDataRepository.save(integrationData);
  }

  // Eliminar un registro
  async remove(id: string): Promise<void> {
    await this.integrationDataRepository.delete(id);
  }
}
