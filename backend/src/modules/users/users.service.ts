import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }


  /**
   * Asocia un usuario existente a una organización existente.
   * @param userId ID del usuario
   * @param organizationId ID de la organización
   */
  async joinOrganization(userId: string, organizationId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['organization'] });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const organization = await this.userRepository.manager.findOne(Organization, { where: { id: organizationId } });
    if (!organization) throw new BadRequestException('Organización no encontrada');
    user.organization = organization;
    await this.userRepository.save(user);
    return user;
  }

  async findByEmail(email: string, withPassword = false) {
    if (withPassword) {
      return this.userRepository
        .createQueryBuilder('user')
        .addSelect('user.password')
        .where('user.email = :email', { email })
        .getOne();
    }
    return this.userRepository.findOneBy({ email });
  }

  async createOAuthUser(email: string, name: string) {
    // Aquí puedes asignar una organización por defecto o lógica adicional
    const user = this.userRepository.create({
      email,
      name,
      password: '', // No password para OAuth
      isActive: true,
    });
    return this.userRepository.save(user);
  }

  async create(dto: CreateUserDto) {
    // Buscar la organización por ID
    const organization = await this.userRepository.manager.findOne(Organization, { where: { id: dto.organizationId } });
    if (!organization) {
      throw new BadRequestException('Organización no encontrada');
    }
    // Hashear el password
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    // Crear el usuario y asociar la organización
    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
      organization,
    });
    await this.userRepository.save(user);
    Sentry.captureMessage(`Nuevo usuario creado: ${dto.email}`, 'info');
    return user;
  }

  async updatePassword(id: string, password: string) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    user.password = await bcrypt.hash(password, 10);
    await this.userRepository.save(user);
    return { message: 'Password actualizado' };
  }

  async delete(id: string) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    await this.userRepository.delete(id);
    return { message: 'Usuario eliminado' };
  }

  async findAll() {
    try {
      return await this.userRepository.find({ relations: ['organization'] });
    } catch (error) {
      Sentry.captureException(error);
      throw new BadRequestException('Error al obtener usuarios');
    }
  }

    async findById(id: string) {
  try {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      const error = new NotFoundException(`Usuario no encontrado: ${id}`);
      Sentry.captureException(error);
      throw error;
    }
    return user;
  } catch (error) {
    Sentry.captureException(error);
    throw new NotFoundException(`Usuario no encontrado: ${id}`);
  }
}
}
