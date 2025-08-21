import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { 
  Achievement, 
  CollectibleCandy, 
  AchievementProgress, 
  CollectionStats,
  GameState,
  CandyPassiveBonus
} from '../models/candy-factory.interface';
import { ACHIEVEMENTS, COLLECTIBLE_CANDIES, RARITY_COLORS } from '../models/achievements.data';

@Injectable({
  providedIn: 'root'
})
export class AchievementService {
  private achievements: Achievement[] = [...ACHIEVEMENTS];
  private collectibleCandies: CollectibleCandy[] = [...COLLECTIBLE_CANDIES];
  
  // Observables for UI
  private achievementsSubject = new BehaviorSubject<Achievement[]>(this.achievements);
  private recentlyUnlockedSubject = new BehaviorSubject<Achievement[]>([]);
  private collectionStatsSubject = new BehaviorSubject<CollectionStats>(this.getInitialCollectionStats());
  private discoveredCandiesSubject = new BehaviorSubject<CollectibleCandy[]>([]);
  
  public achievements$ = this.achievementsSubject.asObservable();
  public recentlyUnlocked$ = this.recentlyUnlockedSubject.asObservable();
  public collectionStats$ = this.collectionStatsSubject.asObservable();
  public discoveredCandies$ = this.discoveredCandiesSubject.asObservable();

  // Special tracking for complex achievements
  private clickTimestamps: number[] = [];
  private lastClickTime = 0;
  private idleStartTime = 0;

  constructor() {
    this.initializeAchievements();
  }

  private initializeAchievements(): void {
    // Initialize all achievements as locked with 0 progress
    this.achievements = this.achievements.map(achievement => ({
      ...achievement,
      unlocked: false,
      progress: 0,
      unlockedAt: undefined
    }));
    
    // Emit the initialized achievements
    this.achievementsSubject.next([...this.achievements]);
  }

  private getInitialCollectionStats(): CollectionStats {
    return {
      totalDiscovered: 0,
      totalCollected: 0,
      rarityBreakdown: {
        common: 0,
        rare: 0,
        epic: 0,
        legendary: 0,
        mythic: 0
      },
      completionPercentage: 0
    };
  }

  // Update achievements based on game state changes
  updateAchievements(gameState: GameState): void {
    const newlyUnlocked: Achievement[] = [];

    this.achievements.forEach(achievement => {
      if (achievement.unlocked) return;

      const meetsRequirements = this.checkAchievementRequirements(achievement, gameState);
      const progress = this.calculateAchievementProgress(achievement, gameState);

      achievement.progress = Math.min(progress, achievement.maxProgress);

      if (meetsRequirements && !achievement.unlocked) {
        this.unlockAchievement(achievement, gameState);
        newlyUnlocked.push(achievement);
      }
    });

    // Emit updates
    this.achievementsSubject.next([...this.achievements]);
    
    if (newlyUnlocked.length > 0) {
      this.recentlyUnlockedSubject.next(newlyUnlocked);
      // Clear recent achievements after showing them
      setTimeout(() => {
        this.recentlyUnlockedSubject.next([]);
      }, 5000);
    }

    this.updateCollectionStats(gameState);
  }

  private checkAchievementRequirements(achievement: Achievement, gameState: GameState): boolean {
    return achievement.requirements.every(req => {
      switch (req.type) {
        case 'candy_total':
          return gameState.totalCandyEarned >= req.value;
        case 'candy_click':
          return gameState.totalClicks >= req.value;
        case 'production_rate':
          return gameState.productionPerSecond >= req.value;
        case 'upgrade_level':
          if (!req.upgradeId) return false;
          return (gameState.upgrades[req.upgradeId] || 0) >= req.value;
        case 'prestige_level':
          return gameState.prestigeLevel >= req.value;
        case 'collection_count':
          return gameState.discoveredCandies.length >= req.value;
        case 'flying_candy_caught':
          return gameState.totalFlyingCandiesCaught >= req.value;
        case 'time_played':
          return gameState.totalPlayTime >= req.value;
        case 'custom':
          // Handle special achievements
          return this.checkCustomRequirement(achievement.id, gameState);
        default:
          return false;
      }
    });
  }

  private calculateAchievementProgress(achievement: Achievement, gameState: GameState): number {
    const requirement = achievement.requirements[0]; // Use first requirement for progress
    
    switch (requirement.type) {
      case 'candy_total':
        return Math.min(gameState.totalCandyEarned, requirement.value);
      case 'candy_click':
        return Math.min(gameState.totalClicks, requirement.value);
      case 'production_rate':
        return Math.min(gameState.productionPerSecond, requirement.value);
      case 'upgrade_level':
        if (!requirement.upgradeId) return 0;
        return Math.min(gameState.upgrades[requirement.upgradeId] || 0, requirement.value);
      case 'prestige_level':
        return Math.min(gameState.prestigeLevel, requirement.value);
      case 'collection_count':
        return Math.min(gameState.discoveredCandies.length, requirement.value);
      case 'flying_candy_caught':
        return Math.min(gameState.totalFlyingCandiesCaught, requirement.value);
      case 'time_played':
        return Math.min(gameState.totalPlayTime, requirement.value);
      default:
        return achievement.progress;
    }
  }

  private checkCustomRequirement(achievementId: string, gameState: GameState): boolean {
    switch (achievementId) {
      case 'golden_catch':
        // This would be triggered externally when catching golden candy
        return false;
      case 'rapid_clicker':
        // Check if player clicked 10 times in 1 second
        return this.clickTimestamps.length >= 10;
      case 'patience_master':
        // Check if player hasn't clicked for 1 hour
        const oneHour = 60 * 60 * 1000;
        return this.idleStartTime > 0 && (Date.now() - this.idleStartTime) >= oneHour;
      default:
        return false;
    }
  }

  private unlockAchievement(achievement: Achievement, gameState: GameState): void {
    achievement.unlocked = true;
    achievement.unlockedAt = Date.now();
    achievement.progress = achievement.maxProgress;

    // Apply achievement rewards
    achievement.rewards.forEach(reward => {
      this.applyAchievementReward(reward, gameState);
    });

  }

  private applyAchievementReward(reward: any, gameState: GameState): void {
    switch (reward.type) {
      case 'unlock_candy':
        if (reward.candyType) {
          this.discoverCandy(reward.candyType, gameState);
        }
        break;
      case 'candy_bonus':
        // This would be handled by the main service
        break;
      // Multipliers are handled by calculating total bonuses
    }
  }

  // Candy collection system
  discoverCandy(candyId: string, gameState: GameState): void {
    if (!gameState.discoveredCandies.includes(candyId)) {
      gameState.discoveredCandies.push(candyId);
      
      const candy = this.collectibleCandies.find(c => c.id === candyId);
      if (candy) {
        candy.discoveredAt = Date.now();
        candy.count = 1;
        gameState.collectedCandies[candyId] = { ...candy };
      }
    } else {
      // Increase count for already discovered candy
      if (gameState.collectedCandies[candyId]) {
        gameState.collectedCandies[candyId].count++;
      }
    }

    this.updateDiscoveredCandies(gameState);
    this.updateCollectionStats(gameState);
  }

  private updateDiscoveredCandies(gameState: GameState): void {
    const discovered = gameState.discoveredCandies
      .map(id => gameState.collectedCandies[id])
      .filter(candy => candy !== undefined);
    
    this.discoveredCandiesSubject.next(discovered);
  }

  private updateCollectionStats(gameState: GameState): void {
    const stats: CollectionStats = {
      totalDiscovered: gameState.discoveredCandies.length,
      totalCollected: Object.values(gameState.collectedCandies)
        .reduce((sum, candy) => sum + candy.count, 0),
      rarityBreakdown: {
        common: 0,
        rare: 0,
        epic: 0,
        legendary: 0,
        mythic: 0
      },
      completionPercentage: 0
    };

    // Count candies by rarity
    gameState.discoveredCandies.forEach(candyId => {
      const candy = gameState.collectedCandies[candyId];
      if (candy) {
        stats.rarityBreakdown[candy.rarity]++;
      }
    });

    // Calculate completion percentage
    stats.completionPercentage = (stats.totalDiscovered / this.collectibleCandies.length) * 100;

    this.collectionStatsSubject.next(stats);
  }

  // Calculate total passive bonuses from collected candies
  calculatePassiveBonuses(gameState: GameState): {
    clickMultiplier: number;
    productionMultiplier: number;
    prestigeMultiplier: number;
    flyingCandySpawnMultiplier: number;
  } {
    const bonuses = {
      clickMultiplier: 1,
      productionMultiplier: 1,
      prestigeMultiplier: 1,
      flyingCandySpawnMultiplier: 1
    };

    // Apply bonuses from collected candies
    Object.values(gameState.collectedCandies).forEach(candy => {
      candy.passiveBonuses.forEach(bonus => {
        const multiplier = Math.pow(bonus.multiplier, candy.count); // Compound effect
        
        switch (bonus.type) {
          case 'click_power':
            bonuses.clickMultiplier *= multiplier;
            break;
          case 'production_rate':
            bonuses.productionMultiplier *= multiplier;
            break;
          case 'prestige_bonus':
            bonuses.prestigeMultiplier *= multiplier;
            break;
          case 'flying_candy_spawn':
            bonuses.flyingCandySpawnMultiplier *= multiplier;
            break;
        }
      });
    });

    // Apply bonuses from achievement rewards
    this.achievements.filter(a => a.unlocked).forEach(achievement => {
      achievement.rewards.forEach(reward => {
        if (reward.permanent) {
          switch (reward.type) {
            case 'click_multiplier':
              bonuses.clickMultiplier *= reward.value;
              break;
            case 'production_multiplier':
              bonuses.productionMultiplier *= reward.value;
              break;
            case 'prestige_bonus':
              bonuses.prestigeMultiplier *= reward.value;
              break;
          }
        }
      });
    });

    return bonuses;
  }

  // Special tracking methods
  trackClick(): void {
    const now = Date.now();
    this.lastClickTime = now;
    this.idleStartTime = 0; // Reset idle timer
    
    // Track rapid clicking
    this.clickTimestamps.push(now);
    this.clickTimestamps = this.clickTimestamps.filter(time => now - time <= 1000); // Keep only last second
  }

  trackFlyingCandyCatch(isGolden: boolean = false): void {
    if (isGolden) {
      // Trigger golden catch achievement
      const goldenAchievement = this.achievements.find(a => a.id === 'golden_catch');
      if (goldenAchievement && !goldenAchievement.unlocked) {
        goldenAchievement.progress = 1;
      }
    }
  }

  startIdleTracking(): void {
    if (this.idleStartTime === 0) {
      this.idleStartTime = Date.now();
    }
  }

  // Utility methods
  getAchievementsByCategory(category: string): Achievement[] {
    return this.achievements.filter(a => a.category === category && (!a.hidden || a.unlocked));
  }

  getUnlockedAchievements(): Achievement[] {
    return this.achievements.filter(a => a.unlocked);
  }

  getTotalAchievementPoints(): number {
    return this.getUnlockedAchievements().length;
  }

  getCompletionPercentage(): number {
    const total = this.achievements.filter(a => !a.hidden).length;
    const unlocked = this.achievements.filter(a => a.unlocked && !a.hidden).length;
    return (unlocked / total) * 100;
  }

  getRarityColor(rarity: string): string {
    return RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] || '#ffffff';
  }

  // Get all available candies for encyclopedia display
  getAllCandies(): CollectibleCandy[] {
    return this.collectibleCandies;
  }
}