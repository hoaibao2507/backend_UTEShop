import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthGuard } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback_secret_key_2025',
    });
  }

  async validate(payload: any) {
    console.log('🔍 JWT payload:', payload); // Debug log
    return { id: payload.sub, email: payload.email }; // Sửa: id thay vì userId
  }
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
