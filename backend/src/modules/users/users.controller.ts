import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import * as Sentry from '@sentry/node';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    createUser(@Body() dto: CreateUserDto) {
        Sentry.setUser({ email: dto.email });
        return this.usersService.create(dto);
    }

    @Get(':id')
    getUser(@Param('id') id: string) {
        return this.usersService.findById(id);
    }
}
