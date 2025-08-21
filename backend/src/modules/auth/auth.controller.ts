import { Controller, Post, Body, Get, Req, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      // en prod: lanzar UnauthorizedException
      throw new Error('Credenciales inválidas');
    }
    return this.authService.login(user);
  }

  @Get('google')
  @ApiOperation({ summary: 'Login con Google OAuth' })
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Passport redirige a Google
  }

  @Get('google/redirect')
  @ApiOperation({ summary: 'Callback de Google OAuth' })
  @ApiResponse({ status: 200, description: 'Usuario autenticado' })
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    // Viene desde GoogleStrategy.validate()
    const { jwt, appRefresh, user } = req.user as {
      jwt: string;
      appRefresh: string;
      user: { id: string; email: string; name?: string };
    };

    const frontendUrl = 'http://localhost:3000';

    const params = new URLSearchParams({
      access_token: jwt,
      refresh_token: appRefresh,
      email: user.email,
      name: user.name || '',
      id: user.id,
    }).toString();

    return res.redirect(`${frontendUrl}/auth-callback?${params}`);
  }
}
