
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  // Guardar refresh tokens en memoria (para MVP, en prod usar DB o Redis)
  private refreshTokens: { [key: string]: string } = {};
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email, true);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
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
