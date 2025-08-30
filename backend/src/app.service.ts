import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';
import { GameState } from './game-state.entity';
import { CreateMessageDto, MessageResponseDto } from './message.dto';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(GameState)
    private gameStateRepository: Repository<GameState>,
  ) {}

  getHello(): string {
    return 'Hello World 1 from Backend!';
  }

  async createMessage(createMessageDto: CreateMessageDto): Promise<MessageResponseDto> {
    const message = this.messageRepository.create(createMessageDto);
    const savedMessage = await this.messageRepository.save(message);
    return savedMessage;
  }

  async getAllMessages(): Promise<MessageResponseDto[]> {
    const messages = await this.messageRepository.find({
      order: { createdAt: 'DESC' },
    });
    return messages;
  }

  async deleteMessage(id: number): Promise<void> {
    await this.messageRepository.delete(id);
  }

  getInfo() {
    return {
      application: 'App1 - User Management System',
      version: '1.0.0',
      description: 'Backend API for App1 with Database Integration',
      message: 'Hello World 1 from Backend!',
      features: [
        'User Management',
        'Authentication',
        'Profile Management',
        'Role-based Access Control',
        'Message Storage & Retrieval',
        'Game State Persistence',
        'Achievement Tracking'
      ],
      endpoints: {
        health: '/health',
        api: '/api/app1',
        messages: '/messages',
        gameState: '/game/state',
        achievements: '/achievements',
      },
      timestamp: new Date().toISOString()
    };
  }

  // Game State Management
  async getGameState(userId: string) {
    console.log(`Loading game state for user ${userId}`);
    
    try {
      // Look for existing game state in database
      const existingGameState = await this.gameStateRepository.findOne({
        where: { user_id: userId }
      });

      if (existingGameState) {
        console.log(`Found existing game state for user ${userId}`);
        
        // Check if this is a multi-planet enhanced game state
        const gameData = existingGameState.game_data;
        const isEnhanced = gameData.isMultiPlanet === true && gameData.planets;
        
        console.log(`Game state type: ${isEnhanced ? 'Enhanced Multi-Planet' : 'Legacy Single-Planet'}`);
        
        return {
          success: true,
          data: {
            ...gameData,
            userId: userId,
            lastSaved: existingGameState.last_saved.getTime()
          },
          isEnhanced: isEnhanced,
          gameVersion: gameData.gameVersion || '1.0.0-single-planet'
        };
      }

      // No existing state, return fresh multi-planet game state
      console.log(`No existing game state for user ${userId}, returning fresh multi-planet state`);
      const freshEnhancedGameState = this.createFreshEnhancedGameState(userId);

      return {
        success: true,
        data: freshEnhancedGameState,
        isEnhanced: true,
        gameVersion: '2.0.0-multi-planet'
      };
    } catch (error) {
      console.error(`Error loading game state for user ${userId}:`, error);
      return {
        success: false,
        error: 'Failed to load game state',
        data: null
      };
    }
  }

  /**
   * Creates a fresh multi-planet enhanced game state for new players
   */
  private createFreshEnhancedGameState(userId: string): any {
    const sweetPlanet = {
      id: 'sweet',
      type: 'sweet',
      name: 'Sweet Planet',
      unlocked: true,
      active: true,
      
      // Core game data
      candy: 0,
      totalCandyEarned: 0,
      clickPower: 1,
      productionPerSecond: 0,
      
      // Upgrades
      upgrades: {},
      unlockedUpgrades: [],
      
      // Sweet planet specific mechanics
      mechanics: {
        sweetnessLevel: 1,
        sugarRushActive: false,
        sugarRushEndTime: 0,
        sweetenessMultiplier: 1.0,
        candyMeltingRate: 0.1,
        flavorIntensity: 1.0,
        sweetenessAccumulation: 0
      },
      
      // UI state
      selectedBuilding: null,
      automationEnabled: true,
      
      // Statistics
      statistics: {
        totalClicks: 0,
        totalCandyProduced: 0,
        totalUpgradesPurchased: 0,
        averageClickPower: 1,
        peakProductionRate: 0,
        timeSpent: 0
      }
    };

    return {
      // Legacy compatibility fields
      candy: 0,
      totalCandyEarned: 0,
      clickPower: 1,
      productionPerSecond: 0,
      upgrades: {},
      unlockedUpgrades: [],
      sessionId: 'server-session-' + userId,
      lastSaved: Date.now(),
      startTime: Date.now(),
      prestigeLevel: 0,
      prestigePoints: 0,
      prestigeMultiplier: 1.0,
      totalPrestigePoints: 0,
      achievements: {},
      unlockedAchievements: [],
      collectedCandies: {},
      discoveredCandies: [],
      totalClicks: 0,
      totalFlyingCandiesCaught: 0,
      totalPlayTime: 0,
      
      // Multi-planet system fields
      planets: {
        sweet: sweetPlanet
      },
      currentPlanet: 'sweet',
      solarSystemLevel: 1,
      
      // Cross-planet systems (empty initially)
      crossPlanetRecipes: [],
      tradeRoutes: [],
      networkSynergy: 1.0,
      
      // Planet unlock progress (only Sweet unlocked)
      planetUnlockProgress: {
        sour: {
          unlockedRequirements: 0,
          totalRequirements: 3,
          requirements: {
            sweetCandyThreshold: { completed: false, progress: 0, target: 10000 },
            upgradesThreshold: { completed: false, progress: 0, target: 5 },
            achievementThreshold: { completed: false, progress: 0, target: 3 }
          }
        },
        cold: {
          unlockedRequirements: 0,
          totalRequirements: 3,
          requirements: {
            sourCandyThreshold: { completed: false, progress: 0, target: 50000 },
            crossPlanetRecipes: { completed: false, progress: 0, target: 2 },
            solarSystemLevel: { completed: false, progress: 0, target: 3 }
          }
        },
        spicy: {
          unlockedRequirements: 0,
          totalRequirements: 3,
          requirements: {
            coldCandyThreshold: { completed: false, progress: 0, target: 100000 },
            networkSynergy: { completed: false, progress: 0, target: 1.5 },
            tradeRoutes: { completed: false, progress: 0, target: 3 }
          }
        },
        bitter: {
          unlockedRequirements: 0,
          totalRequirements: 3,
          requirements: {
            spicyCandyThreshold: { completed: false, progress: 0, target: 250000 },
            crossPlanetAchievements: { completed: false, progress: 0, target: 5 },
            complexityPoints: { completed: false, progress: 0, target: 100 }
          }
        },
        fizzy: {
          unlockedRequirements: 0,
          totalRequirements: 3,
          requirements: {
            bitterCandyThreshold: { completed: false, progress: 0, target: 500000 },
            ultimateRecipes: { completed: false, progress: 0, target: 1 },
            cosmicHarmony: { completed: false, progress: 0, target: 1 }
          }
        }
      },
      
      // Enhanced game state metadata
      gameVersion: '2.0.0-multi-planet',
      isMultiPlanet: true,
      userId: userId
    };
  }

  async saveGameState(userId: string, gameState: any) {
    console.log(`Saving game state for user ${userId}`);
    
    try {
      // Remove userId from gameState data to avoid duplication
      const { userId: _, ...gameData } = gameState;
      
      // Detect and log game state type
      const isEnhanced = gameData.isMultiPlanet === true && gameData.planets;
      console.log(`Saving ${isEnhanced ? 'Enhanced Multi-Planet' : 'Legacy Single-Planet'} game state`);
      
      // Ensure backward compatibility fields are present for enhanced states
      if (isEnhanced && gameData.planets?.sweet) {
        const sweetPlanet = gameData.planets.sweet;
        // Sync legacy fields with sweet planet data for compatibility
        gameData.candy = sweetPlanet.candy || gameData.candy || 0;
        gameData.clickPower = sweetPlanet.clickPower || gameData.clickPower || 1;
        gameData.productionPerSecond = sweetPlanet.productionPerSecond || gameData.productionPerSecond || 0;
        gameData.totalCandyEarned = sweetPlanet.totalCandyEarned || gameData.totalCandyEarned || 0;
        gameData.upgrades = sweetPlanet.upgrades || gameData.upgrades || {};
        gameData.unlockedUpgrades = sweetPlanet.unlockedUpgrades || gameData.unlockedUpgrades || [];
      }
      
      // Use upsert to either update existing or create new record
      await this.gameStateRepository.upsert({
        user_id: userId,
        game_data: gameData,
        last_saved: new Date()
      }, ['user_id']); // Use user_id as conflict column

      console.log(`Successfully saved game state for user ${userId}`);
      return {
        success: true,
        message: 'Game state saved successfully',
        data: {
          userId: userId,
          savedAt: new Date().toISOString(),
          gameVersion: gameData.gameVersion || (isEnhanced ? '2.0.0-multi-planet' : '1.0.0-single-planet'),
          isEnhanced: isEnhanced
        }
      };
    } catch (error) {
      console.error(`Error saving game state for user ${userId}:`, error);
      return {
        success: false,
        error: 'Failed to save game state',
        message: error.message
      };
    }
  }

  async getUserAchievements(userId: string) {
    // For now, return mock achievements
    // TODO: Implement proper database storage with UserAchievement entity
    return {
      success: true,
      data: [
        {
          id: 'sweet-beginning',
          name: 'Sweet Beginning',
          description: 'Earn your first candy',
          icon: '🍭',
          rarity: 'COMMON',
          unlockedAt: new Date().toISOString()
        }
      ]
    };
  }

  async unlockAchievement(userId: string, achievement: any) {
    // For now, just return success
    // TODO: Implement proper database storage with UserAchievement entity
    console.log(`Unlocking achievement for user ${userId}:`, achievement);
    return {
      success: true,
      message: 'Achievement unlocked successfully',
      data: {
        userId: userId,
        achievement: achievement,
        unlockedAt: new Date().toISOString()
      }
    };
  }
}
