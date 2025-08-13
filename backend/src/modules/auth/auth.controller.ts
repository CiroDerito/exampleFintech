import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('refresh')
  @ApiOperation({ summary: 'Renueva el access token usando el refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Nuevo access token' })
  async refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body.refreshToken);
  }


  @Post('login')
  @ApiOperation({ summary: 'Login con email y password' })
  @ApiBody({ schema: { example: { email: 'user@email.com', password: '123456' } } })
  @ApiResponse({ status: 200, description: 'JWT de acceso' })
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new Error('Credenciales inválidas');
    }
    return this.authService.login(user);
  }


  @Get('google')
  @ApiOperation({ summary: 'Login con Google OAuth' })
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Redirige a Google
  }


  @Get('google/redirect')
  @ApiOperation({ summary: 'Callback de Google OAuth' })
  @ApiResponse({ status: 200, description: 'Usuario autenticado' })
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req) {
    return req.user;
  }
}
