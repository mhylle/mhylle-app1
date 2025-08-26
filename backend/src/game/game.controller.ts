import { 
  Controller, 
  Get, 
  Put, 
  Post, 
  Body, 
  Param,
  Request,
  HttpException,
  HttpStatus,
  UnauthorizedException
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ConfigService } from '@nestjs/config';
import { GameService, GameStateData } from './game.service';

interface AuthenticatedRequest extends ExpressRequest {
  user: any;
}

@Controller('game')
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly configService: ConfigService,
  ) {}

  @Get('state')
  async getGameState(@Request() req: ExpressRequest) {
    try {
      const user = await this.validateUserFromRequest(req);
      const gameData = await this.gameService.getGameState(user.id);
      
      if (!gameData) {
        return {
          success: true,
          data: null,
          message: 'No saved game state found'
        };
      }

      return {
        success: true,
        data: gameData,
        lastSaved: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting game state:', error);
      throw new HttpException(
        'Failed to retrieve game state', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('state')
  async saveGameState(
    @Request() req: ExpressRequest,
    @Body() gameData: GameStateData
  ) {
    try {
      const user = await this.validateUserFromRequest(req);
      const savedState = await this.gameService.saveGameState(user.id, gameData);
      
      return {
        success: true,
        data: savedState.game_data,
        lastSaved: savedState.last_saved.toISOString(),
        message: 'Game state saved successfully'
      };
    } catch (error) {
      console.error('Error saving game state:', error);
      throw new HttpException(
        'Failed to save game state', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('sync')
  async syncGameState(
    @Request() req: ExpressRequest,
    @Body() clientGameData: GameStateData
  ) {
    try {
      const user = await this.validateUserFromRequest(req);
      const result = await this.gameService.syncGameState(user.id, clientGameData);
      
      return {
        success: true,
        data: result.gameData,
        serverTimestamp: result.serverTimestamp,
        conflictResolved: result.conflictResolved,
        message: result.conflictResolved 
          ? 'Game state synchronized with conflict resolution' 
          : 'Game state synchronized'
      };
    } catch (error) {
      console.error('Error syncing game state:', error);
      throw new HttpException(
        'Failed to sync game state', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('achievements')
  async getUserAchievements(@Request() req: ExpressRequest) {
    try {
      const user = await this.validateUserFromRequest(req);
      const achievements = await this.gameService.getUserAchievements(user.id);
      
      return {
        success: true,
        data: achievements,
        count: achievements.length
      };
    } catch (error) {
      console.error('Error getting achievements:', error);
      throw new HttpException(
        'Failed to retrieve achievements', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('achievements/:achievementId')
  async unlockAchievement(
    @Request() req: ExpressRequest,
    @Param('achievementId') achievementId: string,
    @Body() metadata?: any
  ) {
    try {
      const user = await this.validateUserFromRequest(req);
      const achievement = await this.gameService.unlockAchievement(
        user.id, 
        achievementId, 
        metadata
      );
      
      if (!achievement) {
        return {
          success: false,
          message: 'Achievement already unlocked'
        };
      }

      return {
        success: true,
        data: achievement,
        message: 'Achievement unlocked successfully'
      };
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      throw new HttpException(
        'Failed to unlock achievement', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private async validateUserFromRequest(request: ExpressRequest): Promise<any> {
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