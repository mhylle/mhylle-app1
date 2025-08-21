import { Injectable } from '@angular/core';
import { ApiService, ApiResponse } from './api.service';
import { GameState } from '../models/candy-factory.interface';

export interface SyncResponse {
  gameData: GameState;
  serverTimestamp: number;
  conflictResolved: boolean;
  message: string;
}

export interface AchievementUnlockRequest {
  progress?: number;
  finalValue?: number;
  context?: any;
}

@Injectable({
  providedIn: 'root'
})
export class GameApiService {
  constructor(private apiService: ApiService) {}

  async loadGameState(): Promise<GameState | null> {
    try {
      const response = await this.apiService.get<GameState>('/game/state');
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to load game state from server:', error);
      return null;
    }
  }

  async saveGameState(gameState: GameState): Promise<boolean> {
    try {
      const response = await this.apiService.put<GameState>('/game/state', gameState);
      return response.success;
    } catch (error) {
      console.error('Failed to save game state to server:', error);
      return false;
    }
  }

  async syncGameState(localGameState: GameState): Promise<SyncResponse | null> {
    try {
      const response = await this.apiService.post<{
        gameData: GameState;
        serverTimestamp: number;
        conflictResolved: boolean;
        message: string;
      }>('/game/sync', localGameState);
      
      if (response.success && response.data) {
        return {
          gameData: response.data.gameData,
          serverTimestamp: response.data.serverTimestamp,
          conflictResolved: response.data.conflictResolved,
          message: response.data.message
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to sync game state with server:', error);
      return null;
    }
  }

  async unlockAchievement(achievementId: string, metadata?: AchievementUnlockRequest): Promise<boolean> {
    try {
      const response = await this.apiService.post(`/game/achievements/${achievementId}`, metadata);
      return response.success;
    } catch (error) {
      console.error('Failed to unlock achievement on server:', error);
      return false;
    }
  }

  async getUserAchievements(): Promise<any[]> {
    try {
      const response = await this.apiService.get<any[]>('/game/achievements');
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to get user achievements:', error);
      return [];
    }
  }
}