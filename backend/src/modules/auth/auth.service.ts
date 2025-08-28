import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';

export interface AuthUser {
  id: string;
  email: string;
  isActive: boolean;
  name?: string;
  role?: string;
}
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

@Injectable()
export class AuthService {
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
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'supersecret_access',
      expiresIn: '15m',
    });
  }

  // Nuevo: refresh como JWT (no en memoria)
  private signRefresh(user: AuthUser): string {
    const payload = { sub: user.id };
    return this.jwtService.sign(payload, {
      secret: process.env.REFRESH_SECRET || 'supersecret_refresh',
      expiresIn: '30d',
    });
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
    await this.usersService.updateLastLogin(user.id);
    const access_token = this.signAccess(user);
    const refresh_token = this.signRefresh(user);
    return { access_token, refresh_token, user };
  }

  async validateOAuthLogin(email: string, name: string): Promise<LoginResponse> {
    let entity = await this.usersService.findByEmail(email);
    if (!entity) {
      entity = await this.usersService.createOAuthUser(email, name);
    }
    const authUser = this.toAuthUser(entity);
    return this.login(authUser);
  }

  // Refresh verificando JWT
  async refreshToken(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: process.env.REFRESH_SECRET || 'supersecret_refresh',
      });

      const entity = await this.usersService.findById(decoded.sub);
      if (!entity) throw new UnauthorizedException('Usuario no encontrado');

      const user = this.toAuthUser(entity);
      const access_token = this.signAccess(user);
      return { access_token, user };
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }
}
