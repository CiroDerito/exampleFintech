import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async create(dto: CreateUserDto) {
        const user = this.userRepository.create(dto);
        await this.userRepository.save(user);
        Sentry.captureMessage(`Nuevo usuario creado: ${dto.email}`, 'info');
        return user;
    }

    async findAll() {
        try {
            return await this.userRepository.find();
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
