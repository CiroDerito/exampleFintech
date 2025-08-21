import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../users/entities/user.entity';

// Datos mínimos que el frontend necesita del usuario autenticado
export interface AuthUser {
  id: string;
  email: string;
  isActive: boolean;
  name?: string;
  role?: string;
}

export interface LoginResponse {
  access_token: string;   // JWT de TU backend
  refresh_token: string;  // refresh de TU backend
  user: AuthUser;
}

@Injectable()
export class AuthService {
  // Para MVP: almacena refresh en memoria (en prod: DB/Redis)
  private refreshTokens: Record<string, string> = {};

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // ---------- Helpers
  private toAuthUser(entity: User): AuthUser {
    return {
      id: entity.id,
      email: entity.email,
      isActive: entity.isActive,
      name: (entity as any).name,
      role: (entity as any).role,
    };
  }

  private signAccess(user: AuthUser): string {
    const payload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload, { expiresIn: '15m' });
  }

  // ---------- Flujos

  async validateUser(email: string, password: string): Promise<AuthUser | null> {
    const user = await this.usersService.findByEmail(email, true);
    if (user && await bcrypt.compare(password, user.password)) {
      return this.toAuthUser(user);
    }
    return null;
  }

  async login(user: AuthUser): Promise<LoginResponse> {
    const access = this.signAccess(user);
    const refresh = uuidv4();
    this.refreshTokens[refresh] = user.id;
    return { access_token: access, refresh_token: refresh, user };
  }

  /**
   * Google OAuth: obtiene (o crea) el usuario y emite TUS tokens
   */
  async validateOAuthLogin(email: string, name: string): Promise<LoginResponse> {
    let entity = await this.usersService.findByEmail(email);
    if (!entity) {
      entity = await this.usersService.createOAuthUser(email, name);
    }
    const authUser = this.toAuthUser(entity);
    return this.login(authUser);
  }

  /**
   * Refresh de access token usando TU refresh token
   */
  async refreshToken(refreshToken: string) {
    const userId = this.refreshTokens[refreshToken];
    if (!userId) throw new UnauthorizedException('Refresh token inválido');

    const entity = await this.usersService.findById(userId);
    if (!entity) throw new UnauthorizedException('Usuario no encontrado');

    const user = this.toAuthUser(entity);
    const access = this.signAccess(user);

    return { access_token: access, user };
  }
}
