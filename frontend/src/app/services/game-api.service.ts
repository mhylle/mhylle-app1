import { Injectable } from '@angular/core';
import { ApiService, ApiResponse } from './api.service';
import { GameState } from '../models/candy-factory.interface';
import { EnhancedGameState } from '../models/planet-system.interface';

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

  async loadGameState(): Promise<GameState | EnhancedGameState | null> {
    try {
      const response = await this.apiService.get<GameState | EnhancedGameState>('/game/state');
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      // Check if this is an authentication error (guest mode)
      if (error instanceof Error && error.message.includes('User is not authenticated')) {
        // Silent fallback to localStorage for guest users - try to load from localStorage
        try {
          const localData = localStorage.getItem('cosmicCandyFactory_gameState');
          if (localData) {
            return JSON.parse(localData);
          }
        } catch (parseError) {
          console.warn('Failed to parse game state from localStorage:', parseError);
        }
        return null; // No error logging for guest mode
      }
      
      // Log other types of errors (network, server errors, etc.)
      console.error('Failed to load game state from server:', error);
      return null;
    }
  }

  async saveGameState(gameState: GameState | EnhancedGameState): Promise<boolean> {
    try {
      const response = await this.apiService.put('/game/state', gameState);
      return response.success;
    } catch (error) {
      // Check if this is an authentication error (guest mode)
      if (error instanceof Error && error.message.includes('User is not authenticated')) {
        // Silent fallback to localStorage for guest users - no error logging
        try {
          localStorage.setItem('cosmicCandyFactory_gameState', JSON.stringify(gameState));
          return true; // Return success since localStorage save succeeded
        } catch (storageError) {
          console.warn('Failed to save game state to localStorage:', storageError);
          return false;
        }
      }
      
      // Log other types of errors (network, server errors, etc.)
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
      // Check if this is an authentication error (guest mode)
      if (error instanceof Error && error.message.includes('User is not authenticated')) {
        // For guests, there's no server sync - return null silently
        return null;
      }
      
      // Log other types of errors (network, server errors, etc.)
      console.error('Failed to sync game state with server:', error);
      return null;
    }
  }

  async unlockAchievement(achievementId: string, metadata?: AchievementUnlockRequest): Promise<boolean> {
    try {
      const response = await this.apiService.post(`/game/achievements/${achievementId}`, metadata);
      return response.success;
    } catch (error) {
      // Check if this is an authentication error (guest mode)
      if (error instanceof Error && error.message.includes('User is not authenticated')) {
        // For guests, achievements can't be unlocked on server - return false silently
        return false;
      }
      
      // Log other types of errors (network, server errors, etc.)
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
      // Check if this is an authentication error (guest mode)
      if (error instanceof Error && error.message.includes('User is not authenticated')) {
        // For guests, no server achievements - return empty array silently
        return [];
      }
      
      // Log other types of errors (network, server errors, etc.)
      console.error('Failed to get user achievements:', error);
      return [];
    }
  }
}