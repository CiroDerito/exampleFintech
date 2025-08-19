import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import * as Sentry from '@sentry/node';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { AuthGuard } from '@nestjs/passport';


// Controlador de usuarios. Expone endpoints para gestión y consulta de usuarios.
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')

export class UsersController {
    // Inyecta el servicio de usuarios
    constructor(private readonly usersService: UsersService) { }
    /**
     * Obtiene un usuario por email
     */
    @Get('by-email/:email')
    @ApiOperation({ summary: 'Obtiene un usuario por email' })
    @ApiParam({ name: 'email', type: String })
    @ApiResponse({ status: 200, description: 'Usuario encontrado', schema: { example: { id: 'uuid-user', email: 'user@email.com', name: 'Juan Perez', dni: null } } })
    getUserByEmail(@Param('email') email: string) {
        return this.usersService.findByEmail(email, false);
    }
    /**
     * Obtiene el perfil del usuario autenticado
     * @param req - Request con el usuario autenticado
     * @returns Datos del usuario
     */
    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Obtener perfil propio' })
    @ApiResponse({ status: 200, description: 'Datos del usuario autenticado', schema: { example: { id: 'uuid-user', email: 'user@email.com', name: 'Juan Perez', phone: '+5491112345678', isActive: true, role: 'user', organization: { id: 'uuid-org', name: 'Org S.A.' }, createdAt: '2024-01-01T00:00:00.000Z' } } })
    async getMe(@Request() req) {
        return this.usersService.findById(req.user.id);
    }

    /**
     * Permite a un usuario autenticado asociarse a una organización existente.
     * Útil para usuarios creados por Google OAuth que aún no tienen organización.
     * @param id - ID del usuario
     * @param body - Objeto con el ID de la organización
     * @returns Usuario actualizado con organización
     */
    @Patch(':id/join-organization')
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Asociar usuario a una organización existente' })
    @ApiParam({ name: 'id', type: String })
    @ApiBody({ schema: { properties: { organizationId: { type: 'string', example: 'uuid-org' } } } })
    @ApiResponse({ status: 200, description: 'Usuario actualizado con organización', schema: { example: { id: 'uuid-user', organization: { id: 'uuid-org', name: 'Org S.A.' } } } })
    async joinOrganization(
        @Param('id') id: string,
        @Body() body: { organizationId: string },
        @Request() req
    ) {
        // Permitir que el propio usuario o un admin asocie la organización
        if (req.user.id !== id && req.user.role !== 'admin') {
            return { error: 'No autorizado para modificar este usuario' };
        }
        return this.usersService.joinOrganization(id, body.organizationId);
    }


    @Post()
    @ApiOperation({ summary: 'Crea un usuario' })
    @ApiBody({ type: CreateUserDto, examples: { default: { value: { email: 'user@email.com', name: 'Juan Perez', dni: 12345678, password: 'password123', phone: '+5491112345678' } } } })
    @ApiResponse({ status: 201, description: 'Usuario creado', schema: { example: { id: 'uuid-user', email: 'user@email.com', name: 'Juan Perez', phone: '+5491112345678', isActive: true, role: 'user', organization: { id: 'uuid-org', name: 'Org S.A.' }, createdAt: '2024-01-01T00:00:00.000Z' } } })
    createUser(@Body() dto: CreateUserDto) {
        Sentry.setUser({ email: dto.email });
        return this.usersService.create(dto);
    }


    @Get()
    @ApiOperation({ summary: 'Lista todos los usuarios' })
    @ApiResponse({ status: 200, description: 'Lista de usuarios', schema: { example: [ { id: 'uuid-user', email: 'user@email.com', name: 'Juan Perez', phone: '+5491112345678', isActive: true, role: 'user', organization: { id: 'uuid-org', name: 'Org S.A.' }, createdAt: '2024-01-01T00:00:00.000Z' } ] } })
    getAllUsers() {
        return this.usersService.findAll();
    }


    @Get(':id')
    @ApiOperation({ summary: 'Obtiene un usuario por ID' })
    @ApiParam({ name: 'id', type: String })
    @ApiResponse({ status: 200, description: 'Usuario encontrado', schema: { example: { id: 'uuid-user', email: 'user@email.com', name: 'Juan Perez', phone: '+5491112345678', isActive: true, role: 'user', organization: { id: 'uuid-org', name: 'Org S.A.' }, createdAt: '2024-01-01T00:00:00.000Z' } } })
    getUser(@Param('id') id: string) {
        return this.usersService.findById(id);
    }


    @Patch(':id/password')
    @ApiOperation({ summary: 'Actualiza el password del usuario' })
    @ApiParam({ name: 'id', type: String })
    @ApiBody({ type: UpdateUserPasswordDto, examples: { default: { value: { password: 'nuevoPassword123' } } } })
    @ApiResponse({ status: 200, description: 'Password actualizado', schema: { example: { success: true } } })
    updatePassword(@Param('id') id: string, @Body() dto: UpdateUserPasswordDto) {
        return this.usersService.updatePassword(id, dto.password);
    }


    /**
     * Actualiza el DNI del usuario
     */
    @Patch(':id/dni')
    @ApiOperation({ summary: 'Actualizar DNI del usuario' })
    @ApiParam({ name: 'id', type: String })
    @ApiBody({ schema: { properties: { dni: { type: 'number', example: 12345678 } } } })
    @ApiResponse({ status: 200, description: 'DNI actualizado', schema: { example: { success: true, dni: 12345678 } } })
    async updateDni(@Param('id') id: string, @Body() body: { dni: number }) {
        return this.usersService.updateDni(id, body.dni);
    }


    @Delete(':id')
    @ApiOperation({ summary: 'Elimina un usuario' })
    @ApiParam({ name: 'id', type: String })
    @ApiResponse({ status: 200, description: 'Usuario eliminado', schema: { example: { success: true } } })
    deleteUser(@Param('id') id: string) {
        return this.usersService.delete(id);
    }
}
