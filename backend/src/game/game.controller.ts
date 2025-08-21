import { 
  Controller, 
  Get, 
  Put, 
  Post, 
  Body, 
  Param,
  UseGuards,
  Request,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { GameService, GameStateData } from './game.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/jwt.strategy';

interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

@Controller('api/app1/game')
@UseGuards(JwtAuthGuard)
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get('state')
  async getGameState(@Request() req: AuthenticatedRequest) {
    try {
      const gameData = await this.gameService.getGameState(req.user.userId);
      
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
    @Request() req: AuthenticatedRequest,
    @Body() gameData: GameStateData
  ) {
    try {
      const savedState = await this.gameService.saveGameState(req.user.userId, gameData);
      
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
    @Request() req: AuthenticatedRequest,
    @Body() clientGameData: GameStateData
  ) {
    try {
      const result = await this.gameService.syncGameState(req.user.userId, clientGameData);
      
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
  async getUserAchievements(@Request() req: AuthenticatedRequest) {
    try {
      const achievements = await this.gameService.getUserAchievements(req.user.userId);
      
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
    @Request() req: AuthenticatedRequest,
    @Param('achievementId') achievementId: string,
    @Body() metadata?: any
  ) {
    try {
      const achievement = await this.gameService.unlockAchievement(
        req.user.userId, 
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
}