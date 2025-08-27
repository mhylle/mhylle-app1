import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('game_states')
export class GameState {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  user_id: string; // References users.id from auth service

  @Column({ type: 'jsonb' })
  game_data: {
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
    
    // Session Validation System (for cross-browser sync)
    sessionStartTime?: number;
    sessionStartCandyAmount?: number;
    lastUserInteraction?: number;
    
    // Achievement & Collection System
    achievements: { [achievementId: string]: {
      achievementId: string;
      currentProgress: number;
      completed: boolean;
      completedAt?: number;
    } };
    unlockedAchievements: string[];
    collectedCandies: { [candyId: string]: {
      id: string;
      name: string;
      description: string;
      rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
      icon: string;
      color: string;
      discoveredAt?: number;
      count: number;
      source: 'flying' | 'achievement' | 'prestige' | 'special_event';
      passiveBonuses: Array<{
        type: 'click_power' | 'production_rate' | 'flying_candy_spawn' | 'prestige_bonus' | 'special';
        multiplier: number;
        description: string;
      }>;
    } };
    discoveredCandies: string[];
    totalClicks: number;
    totalFlyingCandiesCaught: number;
    totalPlayTime: number;
  };

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  last_saved: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}