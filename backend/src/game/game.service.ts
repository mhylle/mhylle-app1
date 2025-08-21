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

    return gameState.game_data;
  }

  async saveGameState(userId: string, gameData: GameStateData): Promise<GameState> {
    let gameState = await this.gameStateRepository.findOne({
      where: { user_id: userId },
    });

    if (gameState) {
      // Update existing game state
      gameState.game_data = gameData;
      gameState.last_saved = new Date();
    } else {
      // Create new game state
      gameState = this.gameStateRepository.create({
        user_id: userId,
        game_data: gameData,
        last_saved: new Date(),
      });
    }

    return await this.gameStateRepository.save(gameState);
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
  }> {
    const serverGameState = await this.gameStateRepository.findOne({
      where: { user_id: userId },
    });

    if (!serverGameState) {
      // No server data, save client data
      const saved = await this.saveGameState(userId, clientGameData);
      return {
        gameData: saved.game_data,
        serverTimestamp: saved.last_saved.getTime(),
        conflictResolved: false,
      };
    }

    const serverTimestamp = serverGameState.last_saved.getTime();
    const clientTimestamp = clientGameData.startTime || 0;

    // Simple conflict resolution: choose the data with higher total candy earned
    let resolvedData = serverGameState.game_data;
    let conflictResolved = false;

    if (clientGameData.totalCandyEarned > serverGameState.game_data.totalCandyEarned) {
      resolvedData = clientGameData;
      conflictResolved = true;
    } else if (serverTimestamp < clientTimestamp) {
      // Server data is older, prefer client
      resolvedData = clientGameData;
      conflictResolved = true;
    }

    // Save the resolved data if there was a conflict
    if (conflictResolved) {
      const saved = await this.saveGameState(userId, resolvedData);
      return {
        gameData: saved.game_data,
        serverTimestamp: saved.last_saved.getTime(),
        conflictResolved: true,
      };
    }

    return {
      gameData: serverGameState.game_data,
      serverTimestamp,
      conflictResolved: false,
    };
  }
}