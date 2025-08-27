import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameState } from '../game-state.entity';
import { UserAchievement } from '../user-achievement.entity';

export interface GameStateData {
  candy: number;
  totalCandyEarned: number;
  clickPower: number;
  productionPerSecond: number;
  upgrades: { [upgradeId: string]: number };
  unlockedUpgrades: string[];
  sessionId: string;
  startTime: number;
  prestigeLevel: number;
  prestigePoints: number;
  prestigeMultiplier: number;
  totalPrestigePoints: number;
  
  // Session Validation System
  sessionStartTime?: number;
  sessionStartCandyAmount?: number;
  lastUserInteraction?: number;
  
  achievements: { [achievementId: string]: any };
  unlockedAchievements: string[];
  collectedCandies: { [candyId: string]: any };
  discoveredCandies: string[];
  totalClicks: number;
  totalFlyingCandiesCaught: number;
  totalPlayTime: number;
}

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(GameState)
    private readonly gameStateRepository: Repository<GameState>,
    @InjectRepository(UserAchievement)
    private readonly userAchievementRepository: Repository<UserAchievement>,
  ) {}

  async getGameState(userId: string): Promise<GameStateData | null> {
    const gameState = await this.gameStateRepository.findOne({
      where: { user_id: userId },
    });

    if (!gameState) {
      return null;
    }

    // Ensure backward compatibility for lastUserInteraction field
    if (!gameState.game_data.lastUserInteraction) {
      gameState.game_data.lastUserInteraction = gameState.last_saved.getTime();
    }

    return gameState.game_data;
  }

  async saveGameState(userId: string, gameData: GameStateData): Promise<{
    success: boolean;
    gameState?: GameState;
    conflict?: {
      serverData: GameStateData;
      clientData: GameStateData;
      message: string;
    };
  }> {
    const serverState = await this.gameStateRepository.findOne({
      where: { user_id: userId },
    });

    // Ensure lastUserInteraction is set if missing (for backward compatibility)
    if (!gameData.lastUserInteraction) {
      gameData.lastUserInteraction = Date.now();
    }

    // If no server state exists, create new one
    if (!serverState) {
      const newGameState = this.gameStateRepository.create({
        user_id: userId,
        game_data: gameData,
        last_saved: new Date(),
      });
      
      const saved = await this.gameStateRepository.save(newGameState);
      return { success: true, gameState: saved };
    }

    // Ensure server data has lastUserInteraction field (for backward compatibility)
    if (!serverState.game_data.lastUserInteraction) {
      serverState.game_data.lastUserInteraction = serverState.last_saved.getTime();
    }

    // Session validation conflict detection (as per SYNC_ANALYSIS.md)
    const hasSessionData = gameData.sessionStartTime && gameData.sessionStartCandyAmount !== undefined;
    
    if (hasSessionData && serverState.last_saved.getTime() > gameData.sessionStartTime!) {
      // Server has been updated since client session started
      const serverProgress = serverState.game_data.candy - gameData.sessionStartCandyAmount!;
      const clientProgress = gameData.candy - gameData.sessionStartCandyAmount!;
      
      if (serverProgress > 0 && clientProgress > 0) {
        // Both made progress - conflict detected
        return {
          success: false,
          conflict: {
            serverData: serverState.game_data,
            clientData: gameData,
            message: `Server: ${serverState.game_data.candy} candy, Your progress: ${gameData.candy} candy`
          }
        };
      }
    }

    // No conflict, save client data
    serverState.game_data = gameData;
    serverState.last_saved = new Date();
    const saved = await this.gameStateRepository.save(serverState);
    
    return { success: true, gameState: saved };
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return await this.userAchievementRepository.find({
      where: { user_id: userId },
      order: { unlocked_at: 'DESC' },
    });
  }

  async unlockAchievement(
    userId: string, 
    achievementId: string, 
    metadata?: any
  ): Promise<UserAchievement | null> {
    // Check if achievement is already unlocked
    const existing = await this.userAchievementRepository.findOne({
      where: { 
        user_id: userId, 
        achievement_id: achievementId 
      },
    });

    if (existing) {
      return existing; // Already unlocked
    }

    // Create new achievement unlock
    const achievement = this.userAchievementRepository.create({
      user_id: userId,
      achievement_id: achievementId,
      unlocked_at: new Date(),
      metadata: metadata || {},
    });

    return await this.userAchievementRepository.save(achievement);
  }

  async syncGameState(userId: string, clientGameData: GameStateData): Promise<{
    gameData: GameStateData;
    serverTimestamp: number;
    conflictResolved: boolean;
    message: string;
  }> {
    const serverGameState = await this.gameStateRepository.findOne({
      where: { user_id: userId },
    });

    if (!serverGameState) {
      // No server data, save client data
      const saveResult = await this.saveGameState(userId, clientGameData);
      if (saveResult.success && saveResult.gameState) {
        return {
          gameData: saveResult.gameState.game_data,
          serverTimestamp: saveResult.gameState.last_saved.getTime(),
          conflictResolved: false,
          message: 'Initial save to server completed'
        };
      }
      
      // If save failed, return error (though this shouldn't happen)
      throw new Error('Failed to save initial game state');
    }

    // Phase 1 approach: Manual sync just loads latest server data
    // This replaces the old "conflict resolution" behavior
    return {
      gameData: serverGameState.game_data,
      serverTimestamp: serverGameState.last_saved.getTime(),
      conflictResolved: false,
      message: 'Loaded latest data from server'
    };
  }
}