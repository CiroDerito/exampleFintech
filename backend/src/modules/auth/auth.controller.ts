import { Controller, Post, Body, Get, Req, UseGuards, Res } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('auth')
@Controller('auth')
// Controlador de autenticación. Expone endpoints para login, refresh y OAuth.
export class AuthController {
  // Inyecta el servicio de autenticación
  constructor(private authService: AuthService) {}

  /**
   * Endpoint para renovar el access token usando el refresh token
   * @param body - DTO con el refresh token
   * @returns Nuevo access token
   */
  @Post('refresh')
  @ApiOperation({ summary: 'Renueva el access token usando el refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Nuevo access token' })
  async refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body.refreshToken);
  }

  /**
   * Endpoint para login con email y password
   * @param body - DTO con email y password
   * @returns JWT de acceso y datos del usuario
   */
  @Post('login')
  @ApiOperation({ summary: 'Login con email y password' })
  @ApiBody({ schema: { example: { email: 'user@email.com', password: '123456' } } })
  @ApiResponse({ status: 200, description: 'JWT de acceso' })
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new Error('Credenciales inválidas');
    }
    return this.authService.login(user);
  }

  /**
   * Endpoint para login con Google OAuth
   * Redirige al usuario a Google para autenticación
   */
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
  async googleAuthRedirect(@Req() req, @Res() res) {
    // Redirige al frontend con los tokens en la URL
    const { access_token, refresh_token, user } = req.user;
    const frontendUrl = 'http://localhost:3000';
    const params = new URLSearchParams({
      access_token,
      refresh_token,
      email: user.email,
      name: user.name || '',
    }).toString();
    res.redirect(`${frontendUrl}/auth-callback?${params}`);
  }
}
