import { Controller, Get, Post, Put, Delete, Body, Param, Headers, UnauthorizedException } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateMessageDto, MessageResponseDto } from './message.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

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
  async getGameState(@Headers('authorization') authHeader: string) {
    const userId = this.extractUserIdFromAuth(authHeader);
    return this.appService.getGameState(userId);
  }

  @Put('game/state')
  async saveGameState(@Headers('authorization') authHeader: string, @Body() gameState: any) {
    const userId = this.extractUserIdFromAuth(authHeader);
    return this.appService.saveGameState(userId, gameState);
  }

  @Get('achievements')
  async getAchievements(@Headers('authorization') authHeader: string) {
    const userId = this.extractUserIdFromAuth(authHeader);
    return this.appService.getUserAchievements(userId);
  }

  @Post('achievements')
  async unlockAchievement(@Headers('authorization') authHeader: string, @Body() achievement: any) {
    const userId = this.extractUserIdFromAuth(authHeader);
    return this.appService.unlockAchievement(userId, achievement);
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'app1-backend',
    };
  }

  private extractUserIdFromAuth(authHeader: string): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid authorization header');
    }
    
    // For now, return a mock user ID - in production you'd decode the JWT
    // TODO: Implement proper JWT validation with auth service
    return 'd104f50a-ee94-4bbc-a644-91ff90f6e0df'; // Admin user ID
  }
}
