import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      scope: ['email', 'profile'],
    } as StrategyOptions);
  }

  async validate(
    _googleAccess: string,
    _googleRefresh: string,
    profile: any,
    done: VerifyCallback,
  ) {
    try {
      const email = profile.emails?.[0]?.value;
      const name  = profile.displayName;
      if (!email) return done(new Error('No se recibió email desde Google'), false);

      // 1) Obtener/crear usuario en TU sistema y
      // 2) Emitir TUS tokens (no usamos los de Google)
      const { access_token, refreshToken, user } =
        await this.authService.validateOAuthLogin(email, name); 

      // Lo que viajará a req.user para el controller
      return done(null, {
        jwt: access_token,       // tu access JWT
        appRefresh: refreshToken, // tu refresh token
        user,                    // AuthUser
      });
    } catch (err) {
      return done(err, false);
    }
  }
}
