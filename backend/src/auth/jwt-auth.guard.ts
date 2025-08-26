import { 
  Injectable, 
  CanActivate, 
  ExecutionContext, 
  UnauthorizedException 
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Get token from Authorization header or cookie
    let token = null;
    
    // First try Authorization header (for direct API calls)
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // If no Authorization header, try cookie (for browser requests)
    if (!token && request.cookies && request.cookies.auth_token) {
      token = request.cookies.auth_token;
    }
    
    if (!token) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    // Validate token with auth service
    const authUrl = this.configService.get<string>('AUTH_URL', 'http://mhylle-auth-service:3000/api/auth');
    
    try {
      // Send token either as Authorization header or Cookie depending on source
      const headers: any = {};
      
      if (request.cookies && request.cookies.auth_token) {
        // Token came from cookie - forward as cookie
        headers['Cookie'] = `auth_token=${token}`;
      } else {
        // Token came from Authorization header - forward as Bearer token
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${authUrl}/validate`, {
        headers
      });

      if (!response.ok) {
        throw new UnauthorizedException('Invalid token');
      }

      const result = await response.json();
      const user = result.data;

      // Transform to match expected user format
      request.user = {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        permissions: user.permissions
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Token validation failed');
    }
  }
}