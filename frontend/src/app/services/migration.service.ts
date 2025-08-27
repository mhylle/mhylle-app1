import { Injectable } from '@angular/core';
import { GameApiService } from './game-api.service';
import { AuthService } from './auth.service';
import { GameState } from '../models/candy-factory.interface';

export interface MigrationResult {
  success: boolean;
  message: string;
  migrated: boolean;
  hadLocalData: boolean;
}

export interface DataComparisonResult {
  hasServerData: boolean;
  localData: GameState | null;
  serverData: GameState | null;
  recommendLocal: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MigrationService {
  private readonly LOCAL_SAVE_KEY = 'cosmic-candy-factory-save';
  private readonly MIGRATION_COMPLETED_KEY = 'cosmic-candy-factory-migrated';

  constructor(
    private gameApiService: GameApiService,
    private authService: AuthService
  ) {}

  /**
   * Check if user has local save data that hasn't been migrated
   */
  hasUnmigratedLocalData(): boolean {
    if (!this.authService.isAuthenticated()) {
      return false;
    }

    const localData = localStorage.getItem(this.LOCAL_SAVE_KEY);
    const migrationCompleted = localStorage.getItem(this.MIGRATION_COMPLETED_KEY);
    
    return localData !== null && migrationCompleted !== 'true';
  }

  /**
   * Get local save data for preview before migration
   */
  getLocalSaveData(): GameState | null {
    try {
      const localData = localStorage.getItem(this.LOCAL_SAVE_KEY);
      if (localData) {
        return JSON.parse(localData) as GameState;
      }
      return null;
    } catch (error) {
      console.error('Failed to parse local save data:', error);
      return null;
    }
  }

  /**
   * Get data comparison for user choice migration
   */
  async getDataComparison(): Promise<DataComparisonResult> {
    const localData = this.getLocalSaveData();
    
    if (!localData) {
      return {
        hasServerData: false,
        localData: null,
        serverData: null,
        recommendLocal: false
      };
    }

    try {
      const serverData = await this.gameApiService.loadGameState();
      const recommendLocal = serverData ? this.shouldUseLocalData(localData, serverData) : true;
      
      return {
        hasServerData: !!serverData,
        localData,
        serverData,
        recommendLocal
      };
    } catch (error) {
      console.error('Failed to load server data for comparison:', error);
      return {
        hasServerData: false,
        localData,
        serverData: null,
        recommendLocal: true
      };
    }
  }

  /**
   * Migrate with user choice - use local data and overwrite server
   */
  async migrateUseLocalData(): Promise<MigrationResult> {
    if (!this.authService.isAuthenticated()) {
      return {
        success: false,
        message: 'User must be logged in to migrate data',
        migrated: false,
        hadLocalData: false
      };
    }

    const localData = this.getLocalSaveData();
    if (!localData) {
      return {
        success: false,
        message: 'No local save data found to migrate',
        migrated: false,
        hadLocalData: false
      };
    }

    try {
      const success = await this.gameApiService.saveGameState(localData);
      if (success) {
        localStorage.setItem(this.MIGRATION_COMPLETED_KEY, 'true');
        return {
          success: true,
          message: 'Local save data uploaded successfully - server data has been overwritten',
          migrated: true,
          hadLocalData: true
        };
      } else {
        return {
          success: false,
          message: 'Failed to upload local data to server',
          migrated: false,
          hadLocalData: true
        };
      }
    } catch (error) {
      console.error('Migration failed:', error);
      return {
        success: false,
        message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        migrated: false,
        hadLocalData: true
      };
    }
  }

  /**
   * Use server data and mark migration as complete - local data is preserved as backup
   */
  async migrateUseServerData(): Promise<MigrationResult> {
    if (!this.authService.isAuthenticated()) {
      return {
        success: false,
        message: 'User must be logged in to access server data',
        migrated: false,
        hadLocalData: false
      };
    }

    const localData = this.getLocalSaveData();
    if (!localData) {
      return {
        success: false,
        message: 'No local save data found',
        migrated: false,
        hadLocalData: false
      };
    }

    try {
      // Load server data
      const serverData = await this.gameApiService.loadGameState();
      if (!serverData) {
        return {
          success: false,
          message: 'No server data found to use',
          migrated: false,
          hadLocalData: true
        };
      }

      console.log('Using server data:', serverData);
      
      // Mark migration as completed
      localStorage.setItem(this.MIGRATION_COMPLETED_KEY, 'true');
      
      // Directly update the candy factory service with server data
      // This ensures the game state is immediately updated with server data
      (window as any).candyFactoryService?.updateGameStateFromServer(serverData);
      
      return {
        success: true,
        message: 'Server save data loaded successfully - local data preserved as backup',
        migrated: true,
        hadLocalData: true
      };
    } catch (error) {
      console.error('Failed to load server data:', error);
      return {
        success: false,
        message: `Failed to load server data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        migrated: false,
        hadLocalData: true
      };
    }
  }

  /**
   * Migrate local save to server
   */
  async migrateLocalSaveToServer(): Promise<MigrationResult> {
    if (!this.authService.isAuthenticated()) {
      return {
        success: false,
        message: 'User must be logged in to migrate data',
        migrated: false,
        hadLocalData: false
      };
    }

    const localData = this.getLocalSaveData();
    if (!localData) {
      // Mark as migrated even if no local data exists
      localStorage.setItem(this.MIGRATION_COMPLETED_KEY, 'true');
      return {
        success: true,
        message: 'No local save data found to migrate',
        migrated: false,
        hadLocalData: false
      };
    }

    try {
      // Check if server already has data
      const serverData = await this.gameApiService.loadGameState();
      
      if (serverData) {
        // Server has data, need to handle conflict
        const useLocalData = this.shouldUseLocalData(localData, serverData);
        
        if (useLocalData) {
          const success = await this.gameApiService.saveGameState(localData);
          if (success) {
            localStorage.setItem(this.MIGRATION_COMPLETED_KEY, 'true');
            return {
              success: true,
              message: 'Local save data migrated successfully (replaced server data)',
              migrated: true,
              hadLocalData: true
            };
          } else {
            return {
              success: false,
              message: 'Failed to save local data to server',
              migrated: false,
              hadLocalData: true
            };
          }
        } else {
          // Keep server data, mark local as migrated
          localStorage.setItem(this.MIGRATION_COMPLETED_KEY, 'true');
          return {
            success: true,
            message: 'Server data kept (was more advanced than local save)',
            migrated: false,
            hadLocalData: true
          };
        }
      } else {
        // No server data, migrate local data
        const success = await this.gameApiService.saveGameState(localData);
        if (success) {
          localStorage.setItem(this.MIGRATION_COMPLETED_KEY, 'true');
          return {
            success: true,
            message: 'Local save data migrated successfully to server',
            migrated: true,
            hadLocalData: true
          };
        } else {
          return {
            success: false,
            message: 'Failed to migrate local data to server',
            migrated: false,
            hadLocalData: true
          };
        }
      }
    } catch (error) {
      console.error('Migration failed:', error);
      return {
        success: false,
        message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        migrated: false,
        hadLocalData: true
      };
    }
  }

  /**
   * Determine which save data to use based on progress
   */
  private shouldUseLocalData(localData: GameState, serverData: GameState): boolean {
    // Compare total candy earned as the primary metric
    if (localData.totalCandyEarned > serverData.totalCandyEarned) {
      return true;
    }
    
    // If candy is similar, compare prestige level
    if (Math.abs(localData.totalCandyEarned - serverData.totalCandyEarned) < 1000) {
      if (localData.prestigeLevel > serverData.prestigeLevel) {
        return true;
      }
      
      // If prestige is similar, compare total achievements
      if (localData.prestigeLevel === serverData.prestigeLevel) {
        const localAchievements = localData.unlockedAchievements?.length || 0;
        const serverAchievements = serverData.unlockedAchievements?.length || 0;
        return localAchievements > serverAchievements;
      }
    }
    
    return false;
  }

  /**
   * Mark migration as completed manually (for testing or admin purposes)
   */
  markMigrationCompleted(): void {
    localStorage.setItem(this.MIGRATION_COMPLETED_KEY, 'true');
  }

  /**
   * Reset migration status (for testing purposes)
   */
  resetMigrationStatus(): void {
    localStorage.removeItem(this.MIGRATION_COMPLETED_KEY);
  }

  /**
   * Get migration status info
   */
  getMigrationInfo(): {
    isCompleted: boolean;
    hasLocalData: boolean;
    canMigrate: boolean;
  } {
    const isCompleted = localStorage.getItem(this.MIGRATION_COMPLETED_KEY) === 'true';
    const hasLocalData = localStorage.getItem(this.LOCAL_SAVE_KEY) !== null;
    const canMigrate = this.authService.isAuthenticated() && hasLocalData && !isCompleted;

    return {
      isCompleted,
      hasLocalData,
      canMigrate
    };
  }
}