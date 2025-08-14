// Interfaz que representa los datos básicos de un usuario autenticado
export interface AuthUser {
  id: string;
  email: string;
  isActive: boolean;
  name?: string;
  role?: string;
}

// Interfaz para la respuesta del login
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
// Servicio de autenticación. Gestiona login, validación de usuario y refresh tokens.
export class AuthService {
  // Guardar refresh tokens en memoria (para MVP, en producción usar DB o Redis)
  private refreshTokens: { [key: string]: string } = {};

  // Inyecta el servicio de usuarios y JWT
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Valida las credenciales del usuario
   * @param email - Email del usuario
   * @param password - Contraseña en texto plano
   * @returns Datos del usuario sin la contraseña si es válido, null si no
   */
  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email, true);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  /**
   * Genera los tokens de acceso y refresh para el usuario autenticado
   * @param user - Datos del usuario autenticado
   * @returns Objeto con access_token, refresh_token y datos del usuario
   */
  async login(user: AuthUser): Promise<LoginResponse> {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = uuidv4();
    this.refreshTokens[refreshToken] = user.id;
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user,
    };
  }

  async validateOAuthLogin(email: string, name: string) {
    let user = await this.usersService.findByEmail(email);
    if (!user) {
      user = await this.usersService.createOAuthUser(email, name);
    }
    return this.login(user);
  }

  async refreshToken(refreshToken: string) {
    const userId = this.refreshTokens[refreshToken];
    if (!userId) throw new UnauthorizedException('Refresh token inválido');
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    return {
      access_token: accessToken,
      user,
    };
  }
}
