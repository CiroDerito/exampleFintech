import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';
import { BcraService } from '../bcra/bcra.service';

// Servicio de usuarios. Gestiona la lógica de negocio y acceso a datos de usuarios.
@Injectable()
export class UsersService {
  // Inyecta el repositorio de usuarios y el servicio de auditoría
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditService: AuditService,
    private readonly bcraService: BcraService,
  ) { }

    /**
   * Actualiza el DNI de un usuario existente.
   */
 async updateDni(id: string, dni: number) {
  const user = await this.userRepository.findOne({ where: { id }, relations: ['bcra'] });
  if (!user) throw new NotFoundException('Usuario no encontrado');

  user.dni = dni;
  await this.userRepository.save(user);

  // Llamar a BCRA al mismo tiempo
const bcraData = await this.bcraService.consultarDeudores(id, String(dni));
  return { 
    success: true, 
    dni: user.dni,
    bcra: bcraData
  };
}
    /**
   * Actualiza el DNI de un usuario por email.
   */
  async updateDniByEmail(email: string, dni: number) {
    const user = await this.userRepository.findOneBy({ email });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    user.dni = dni;
    await this.userRepository.save(user);
    return { success: true, dni: user.dni };
  }

  /**
   * Asocia un usuario existente a una organización existente.
   * @param userId ID del usuario
   * @param organizationId ID de la organización
   * @returns Usuario actualizado
   */
  async joinOrganization(userId: string, organizationId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['organization'] });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const organization = await this.userRepository.manager.findOne(Organization, { where: { id: organizationId } });
    if (!organization) throw new BadRequestException('Organización no encontrada');
    user.organization = organization;
    await this.userRepository.save(user);
    // Log de auditoría
    await this.auditService.log(userId, 'join_organization', { organizationId });
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
    // Hashear el password
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    // Crear el usuario sin organización
    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });
    await this.userRepository.save(user);

    // Crear la organización y asociarla al usuario
    const organizationRepo = this.userRepository.manager.getRepository(Organization);
    // Verificar que el usuario no tenga ya una organización
    const existingOrg = await organizationRepo.findOne({ where: { user: { id: user.id } } });
    if (existingOrg) {
      throw new BadRequestException('El usuario ya tiene una organización asociada');
    }
    const organization = organizationRepo.create({
      name: dto.name + ' Organization',
      user: user,
    });
    await organizationRepo.save(organization);

    // Asociar la organización al usuario y guardar
    user.organization = organization;
    await this.userRepository.save(user);

    Sentry.captureMessage(`Nuevo usuario y organización creados: ${dto.email}`, 'info');
    return user;
  }

  async updatePassword(id: string, password: string) {
  const user = await this.userRepository.findOneBy({ id });
  if (!user) throw new NotFoundException('Usuario no encontrado');
  user.password = await bcrypt.hash(password, 10);
  user.updatedAt = new Date();
  await this.userRepository.save(user);
  return { message: 'Password actualizado', updatedAt: user.updatedAt };
  }

  async updateLastLogin(id: string) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    user.last_login = new Date();
    await this.userRepository.save(user);
    return { message: 'last_login actualizado', last_login: user.last_login };
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
  const user = await this.userRepository.findOne({ where: { id }, relations: ['tiendaNube', 'metaAds', 'bcra'], }); // loadRelationIds: trues
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
  // /**
  //  * Asocia una org nueva a un user ( crea y asocia)
  //  */
  async joinOrganizationNew(userId: string, organizationId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['organization'] });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const org = await this.userRepository.findOne({ where: { id: organizationId } });
    if (!org) throw new NotFoundException('Organización no encontrada');

    // FK está en USERS → asociá desde user
    // user.organization = org;
    // // (opcional) org.user = user; si pusiste JoinColumn del lado Organization también
    await this.userRepository.save(user);
    return { id: user.id, organization: { id: org.id, name: org.name } };
  }

  async createAndJoinOrganization(userId: string, data: { name: string; phone?: string; address?: string }) {
    if (!data.name?.trim()) throw new BadRequestException('Nombre de organización requerido');
    const org = await this.userRepository.create({
      name: data.name.trim(),
    
    });
    return this.joinOrganization(userId, org.id);
  }
}

