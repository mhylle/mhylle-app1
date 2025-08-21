import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

export interface JwtPayload {
  sub: string;
  email: string;
  firstName: string;
  lastName: string;
  apps: string[];
  roles: Record<string, string[]>;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  apps: string[];
  roles: Record<string, string[]>;
}

@Injectable()
export class JwtStrategy {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateToken(token: string): Promise<AuthUser | null> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET') || 'your-secret-key-here',
      }) as JwtPayload;

      // Check if user has access to app1
      if (!payload.apps.includes('app1')) {
        throw new UnauthorizedException('No access to app1');
      }

      return {
        userId: payload.sub,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        apps: payload.apps,
        roles: payload.roles,
      };
    } catch (error) {
      console.error('JWT validation failed:', error.message);
      return null;
    }
  }

  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}