import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

    async findById(id: string) {
        const user = await this.userRepository.findOneBy({ id });
        if (!user) {
            Sentry.captureMessage(`Usuario no encontrado: ${id}`, 'warning');
            return { error: 'Usuario no encontrado' };
        }
        return user;
    }
}
