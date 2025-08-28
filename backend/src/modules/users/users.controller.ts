import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UserRole } from './entities/user.entity';
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  /** * Obtiene un usuario por email */
  @Get('by-email/:email')
  @ApiOperation({ summary: 'Obtiene un usuario por email' })
  @ApiParam({ name: 'email', type: String })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado',
    schema: {
      example: { id: 'uuid-user', email: 'user@email.com', name: 'Juan Perez', dni: null },
    },
  })
  async getUserByEmail(@Param('email') email: string) {
    if (!email) throw new BadRequestException('Email requerido');
    const user = await this.usersService.findByEmail(email, false);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  /**
   * Perfil del usuario autenticado
   */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Obtener perfil propio' })
  @ApiResponse({
    status: 200,
    description: 'Datos del usuario autenticado',
    schema: {
      example: {
        id: 'uuid-user',
        email: 'user@email.com',
        name: 'Juan Perez',
        phone: '+5491112345678',
        isActive: true,
        role: 'USER',
        organization: { id: 'uuid-org', name: 'Org S.A.' },
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  async getMe(@Request() req) {
    const me = await this.usersService.findById(req.user.id);
    if (!me) {
      console.error('[GET /users/me] Usuario no encontrado para id:', req.user.id);
      throw new NotFoundException('Usuario no encontrado');
    }
    return me;
  }

  /**
   * Asociar usuario a organización existente por :id (admin o el mismo usuario)
   */
  @Patch(':id/join-organization')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Asociar usuario a una organización existente' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({
    schema: { properties: { organizationId: { type: 'string', example: 'uuid-org' } } },
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado con organización',
    schema: { example: { id: 'uuid-user', organization: { id: 'uuid-org', name: 'Org S.A.' } } },
  })
  async joinOrganization(
    @Param('id') id: string,
    @Body() body: { organizationId: string },
    @Request() req,
  ) {
    if (!body?.organizationId) {
      throw new BadRequestException('organizationId es requerido');
    }
    // Permitir que el propio usuario o un admin asocie la organización
    if (req.user.id !== id && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('No autorizado para modificar este usuario');
    }
    return this.usersService.joinOrganization(id, body.organizationId);
  }

  /**
   * Crear o asociar organización al usuario autenticado (sin pasar :id)
   */
  @Patch('me/join-organization')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Crear o asociar organización al usuario autenticado' })
  @ApiBody({
    schema: {
      oneOf: [
        {
          type: 'object',
          properties: { organizationId: { type: 'string', example: 'uuid-org' } },
          required: ['organizationId'],
        },
        {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Mi Organización S.A.' },
            phone: { type: 'string', example: '+54 11 1234-5678' },
            address: { type: 'string', example: 'Calle Falsa 123, CABA' },
          },
          required: ['name'],
        },
      ],
    },
  })
  async joinOrganizationMe(
    @Body()
    body: { organizationId?: string; name?: string; phone?: string; address?: string },
    @Request() req,
  ) {
    const userId = req.user.id as string;

    if (body.organizationId) {
      // ⚠️ Si tu service NO tiene joinOrganizationNew, usa joinOrganization:
      // return this.usersService.joinOrganization(userId, body.organizationId);
      return this.usersService.joinOrganizationNew(userId, body.organizationId);
    }

    if (body.name) {
      return this.usersService.createAndJoinOrganization(userId, {
        name: body.name,
        phone: body.phone,
        address: body.address,
      });
    }

    throw new BadRequestException('Debe enviar organizationId o name');
  }

  /**
   * Crear usuario
   */
  @Post()
  @ApiOperation({ summary: 'Crea un usuario' })
  @ApiBody({
    type: CreateUserDto,
    examples: {
      default: {
        value: {
          email: 'user@email.com',
          name: 'Juan Perez',
          dni: 12345678,
          password: 'password123',
          phone: '+5491112345678',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado',
    schema: {
      example: {
        id: 'uuid-user',
        email: 'user@email.com',
        name: 'Juan Perez',
        phone: '+5491112345678',
        isActive: true,
        role: 'USER',
        organization: { id: 'uuid-org', name: 'Org S.A.' },
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  async createUser(@Body() dto: CreateUserDto) {
    try {
      Sentry.setUser({ email: dto.email });
      return await this.usersService.create(dto);
    } catch (e: any) {
      if (e?.code === '23505') {
        throw new ConflictException('El email o DNI ya está registrado');
      }
      throw new InternalServerErrorException(e?.message ?? 'No se pudo crear el usuario');
    }
  }

  /**
   * Listar usuarios
   */
  @Get()
  @ApiOperation({ summary: 'Lista todos los usuarios' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios',
    schema: {
      example: [
        {
          id: 'uuid-user',
          email: 'user@email.com',
          name: 'Juan Perez',
          phone: '+5491112345678',
          isActive: true,
          role: 'USER',
          organization: { id: 'uuid-org', name: 'Org S.A.' },
          createdAt: '2024-01-01T00:00:00.000Z',
        }
      ]
    }
  })
  getAllUsers() {
    return this.usersService.findAll();
  }

  /**
   * Obtener usuario por ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un usuario por ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado',
    schema: {
      example: {
        id: 'uuid-user',
        email: 'user@email.com',
        name: 'Juan Perez',
        phone: '+5491112345678',
        isActive: true,
        role: 'USER',
        organization: { id: 'uuid-org', name: 'Org S.A.' },
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  /**
   * Actualizar password (propio o admin)
   */
  @Patch(':id/password')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Actualiza el password del usuario' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({
    type: UpdateUserPasswordDto,
    examples: { default: { value: { password: 'nuevoPassword123' } } },
  })
  @ApiResponse({ status: 200, description: 'Password actualizado', schema: { example: { success: true } } })
  async updatePassword(@Param('id') id: string, @Body() dto: UpdateUserPasswordDto, @Request() req) {
    if (req.user.id !== id && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('No autorizado para cambiar el password de este usuario');
    }
    if (!dto?.password || dto.password.length < 6) {
      throw new BadRequestException('El password debe tener al menos 6 caracteres');
    }
    try {
      return await this.usersService.updatePassword(id, dto.password);
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;
      throw new InternalServerErrorException(e?.message ?? 'No se pudo actualizar el password');
    }
  }

  /**
   * Actualizar DNI (Cuit/Cuil)
   */
  @Patch(':id/dni')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Actualizar DNI del usuario y consultar BCRA' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ schema: { properties: { dni: { type: 'number', example: 12345678 } } } })
  @ApiResponse({ status: 200, description: 'DNI actualizado y datos BCRA' })
  async updateDni(@Param('id') id: string, @Body() body: { dni: number }, @Request() req) {
    if (req.user.id !== id && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('No autorizado para cambiar el DNI de este usuario');
    }
    const dni = Number(body?.dni);
    const dniStr = String(body?.dni ?? '').replace(/\D/g, '');
    if (!/^\d{11}$/.test(dniStr)) {
      throw new BadRequestException('Cuil/Cuit inválido (debe tener 11 dígitos)');
    }
    try {
       return await this.usersService.updateDni(id, Number(dniStr));
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;
      throw new InternalServerErrorException(e?.message ?? 'No se pudo actualizar el DNI');
    }
  }

  /**
   * Eliminar usuario (solo admin)
   */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Elimina un usuario' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Usuario eliminado', schema: { example: { success: true } } })
  async deleteUser(@Param('id') id: string, @Request() req) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo un administrador puede eliminar usuarios');
    }
    try {
      return await this.usersService.delete(id);
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;
      throw new InternalServerErrorException(e?.message ?? 'No se pudo eliminar el usuario');
    }
  }
}
