import { Controller, Get, Post, Put, Delete, Body, Param, Headers, UnauthorizedException, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { CreateMessageDto, MessageResponseDto } from './message.dto';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('info')
  getInfo() {
    return this.appService.getInfo();
  }

  @Post('messages')
  async createMessage(@Body() createMessageDto: CreateMessageDto): Promise<MessageResponseDto> {
    return this.appService.createMessage(createMessageDto);
  }

  @Get('messages')
  async getAllMessages(): Promise<MessageResponseDto[]> {
    return this.appService.getAllMessages();
  }

  @Delete('messages/:id')
  async deleteMessage(@Param('id') id: string): Promise<void> {
    return this.appService.deleteMessage(parseInt(id));
  }

  // Game State Endpoints  
  @Get('game/state')
  async getGameState(@Req() request: Request) {
    const user = await this.validateUserFromRequest(request);
    return this.appService.getGameState(user.id);
  }

  @Put('game/state')
  async saveGameState(@Req() request: Request, @Body() gameState: any) {
    const user = await this.validateUserFromRequest(request);
    return this.appService.saveGameState(user.id, gameState);
  }

  @Get('achievements')
  async getAchievements(@Req() request: Request) {
    const user = await this.validateUserFromRequest(request);
    return this.appService.getUserAchievements(user.id);
  }

  @Post('achievements')
  async unlockAchievement(@Req() request: Request, @Body() achievement: any) {
    const user = await this.validateUserFromRequest(request);
    return this.appService.unlockAchievement(user.id, achievement);
  }

  // Auth proxy endpoints - all auth goes through app1 backend
  @Post('auth/login')
  async login(@Body() loginData: any, @Res({ passthrough: true }) response: Response) {
    const authUrl = this.configService.get<string>('AUTH_URL', 'http://mhylle-auth-service:3000/api/auth');
    
    const authResponse = await fetch(`${authUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData),
    });

    if (!authResponse.ok) {
      const error = await authResponse.json();
      throw new UnauthorizedException(error.message || 'Login failed');
    }

    const result = await authResponse.json();
    
    // Forward cookie from auth service to client
    const cookies = authResponse.headers.get('set-cookie');
    if (cookies) {
      // Ensure the cookie domain is set correctly for our single domain architecture
      const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
      const updatedCookies = cookieArray.map(cookie => {
        // Make sure domain is set to mhylle.com for proper persistence
        if (!cookie.includes('Domain=')) {
          return `${cookie}; Domain=mhylle.com`;
        }
        return cookie;
      });
      response.setHeader('Set-Cookie', updatedCookies);
    }

    return result;
  }

  @Post('auth/logout')
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const authUrl = this.configService.get<string>('AUTH_URL', 'http://mhylle-auth-service:3000/api/auth');
    
    // Forward cookies to auth service
    const authResponse = await fetch(`${authUrl}/logout`, {
      method: 'POST',
      headers: {
        'Cookie': request.headers.cookie || '',
      },
    });

    // Forward cookie clearing from auth service
    const cookies = authResponse.headers.get('set-cookie');
    if (cookies) {
      // Ensure the cookie domain is set correctly for proper clearing
      const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
      const updatedCookies = cookieArray.map(cookie => {
        // Make sure domain is set to mhylle.com for proper cookie clearing
        if (!cookie.includes('Domain=')) {
          return `${cookie}; Domain=mhylle.com`;
        }
        return cookie;
      });
      response.setHeader('Set-Cookie', updatedCookies);
    }

    const result = await authResponse.json();
    return result;
  }

  @Get('auth/validate')
  async validate(@Req() request: Request) {
    const authUrl = this.configService.get<string>('AUTH_URL', 'http://mhylle-auth-service:3000/api/auth');
    
    // Forward cookies to auth service  
    const authResponse = await fetch(`${authUrl}/validate`, {
      headers: {
        'Cookie': request.headers.cookie || '',
      },
    });

    if (!authResponse.ok) {
      throw new UnauthorizedException('Invalid token');
    }

    const result = await authResponse.json();
    return result;
  }

  @Post('auth/register')
  async register(@Body() registerData: any) {
    const authUrl = this.configService.get<string>('AUTH_URL', 'http://mhylle-auth-service:3000/api/auth');
    
    const authResponse = await fetch(`${authUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData),
    });

    if (!authResponse.ok) {
      const error = await authResponse.json();
      throw new UnauthorizedException(error.message || 'Registration failed');
    }

    const result = await authResponse.json();
    return result;
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'app1-backend',
    };
  }

  private async validateUserFromRequest(request: Request): Promise<any> {
    const authUrl = this.configService.get<string>('AUTH_URL', 'http://mhylle-auth-service:3000/api/auth');
    
    // Forward cookies to auth service for validation
    const authResponse = await fetch(`${authUrl}/validate`, {
      headers: {
        'Cookie': request.headers.cookie || '',
      },
    });

    if (!authResponse.ok) {
      throw new UnauthorizedException('Invalid authentication');
    }

    const result = await authResponse.json();
    return result.data; // Return user data from auth service
  }
}
