import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import * as Sentry from '@sentry/node';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { AuthGuard } from '@nestjs/passport';


@ApiTags('users')
@ApiBearerAuth()
@Controller('users')

export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    /**
     * Obtiene el perfil del usuario autenticado
     */
    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Obtener perfil propio' })
    @ApiResponse({ status: 200, description: 'Datos del usuario autenticado' })
    async getMe(@Request() req) {
        return this.usersService.findById(req.user.id);
    }

    /**
     * Permite a un usuario autenticado asociarse a una organización existente.
     * Útil para usuarios creados por Google OAuth que aún no tienen organización.
     */
    @Patch(':id/join-organization')
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Asociar usuario a una organización existente' })
    @ApiParam({ name: 'id', type: String })
    @ApiBody({ schema: { properties: { organizationId: { type: 'string', example: 'uuid-org' } } } })
    @ApiResponse({ status: 200, description: 'Usuario actualizado con organización' })
    async joinOrganization(
        @Param('id') id: string,
        @Body() body: { organizationId: string },
        @Request() req
    ) {
        // Solo el propio usuario puede asociarse a una organización
        if (req.user.id !== id) {
            return { error: 'No autorizado para modificar este usuario' };
        }
        return this.usersService.joinOrganization(id, body.organizationId);
    }


    @Post()
    @ApiOperation({ summary: 'Crea un usuario' })
    @ApiBody({ type: CreateUserDto })
    @ApiResponse({ status: 201, description: 'Usuario creado' })
    createUser(@Body() dto: CreateUserDto) {
        Sentry.setUser({ email: dto.email });
        return this.usersService.create(dto);
    }


    @Get()
    @ApiOperation({ summary: 'Lista todos los usuarios' })
    @ApiResponse({ status: 200, description: 'Lista de usuarios' })
    getAllUsers() {
        return this.usersService.findAll();
    }


    @Get(':id')
    @ApiOperation({ summary: 'Obtiene un usuario por ID' })
    @ApiParam({ name: 'id', type: String })
    @ApiResponse({ status: 200, description: 'Usuario encontrado' })
    getUser(@Param('id') id: string) {
        return this.usersService.findById(id);
    }


    @Patch(':id/password')
    @ApiOperation({ summary: 'Actualiza el password del usuario' })
    @ApiParam({ name: 'id', type: String })
    @ApiBody({ type: UpdateUserPasswordDto })
    @ApiResponse({ status: 200, description: 'Password actualizado' })
    updatePassword(@Param('id') id: string, @Body() dto: UpdateUserPasswordDto) {
        return this.usersService.updatePassword(id, dto.password);
    }


    @Delete(':id')
    @ApiOperation({ summary: 'Elimina un usuario' })
    @ApiParam({ name: 'id', type: String })
    @ApiResponse({ status: 200, description: 'Usuario eliminado' })
    deleteUser(@Param('id') id: string) {
        return this.usersService.delete(id);
    }
}
