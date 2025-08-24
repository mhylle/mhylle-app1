import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';
import { CreateMessageDto, MessageResponseDto } from './message.dto';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
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
    // For now, return a mock game state that matches the frontend interface
    // TODO: Implement proper database storage with GameState entity
    return {
      success: true,
      data: {
        candy: 0,
        totalCandyEarned: 0,
        clickPower: 4,
        productionPerSecond: 0,
        upgrades: {
          'candy-wrapper-bot': 3,  // level count
          'sugar-sprinkler': 0,
          'lollipop-cyclotron': 0
        },
        unlockedUpgrades: ['candy-wrapper-bot'],  // array of unlocked upgrade IDs
        sessionId: 'server-session-' + userId,
        lastSaved: Date.now(),
        startTime: Date.now(),
        prestigeLevel: 0,
        prestigePoints: 0,
        prestigeMultiplier: 1.0,
        totalPrestigePoints: 0,
        achievements: {},  // object not array
        unlockedAchievements: ['sweet-beginning'],
        collectedCandies: {},
        discoveredCandies: [],
        totalClicks: 0,
        totalFlyingCandiesCaught: 0,
        totalPlayTime: 0,
        userId: userId
      }
    };
  }

  async saveGameState(userId: string, gameState: any) {
    // For now, just return success - in production would save to database
    // TODO: Implement proper database storage with GameState entity
    console.log(`Saving game state for user ${userId}:`, gameState);
    return {
      success: true,
      message: 'Game state saved successfully',
      data: {
        userId: userId,
        savedAt: new Date().toISOString()
      }
    };
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
