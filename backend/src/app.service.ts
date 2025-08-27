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
        console.log(`Found existing game state for user ${userId}:`, existingGameState.game_data);
        return {
          success: true,
          data: {
            ...existingGameState.game_data,
            userId: userId,
            lastSaved: existingGameState.last_saved.getTime()
          }
        };
      }

      // No existing state, return fresh game state
      console.log(`No existing game state for user ${userId}, returning fresh state`);
      const freshGameState = {
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
        userId: userId
      };

      return {
        success: true,
        data: freshGameState
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

  async saveGameState(userId: string, gameState: any) {
    console.log(`Saving game state for user ${userId}:`, gameState);
    
    try {
      // Remove userId from gameState data to avoid duplication
      const { userId: _, ...gameData } = gameState;
      
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
          savedAt: new Date().toISOString()
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
