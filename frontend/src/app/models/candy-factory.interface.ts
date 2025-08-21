export interface CandyUpgrade {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  tier: number;
  type: 'click' | 'production';
  powerPerLevel: number;
  productionPerSecond?: number;
  unlockRequirement: {
    type: 'candy' | 'production' | 'upgrade';
    value: number | string;
  };
  icon: string;
}

export interface GameState {
  candy: number;
  totalCandyEarned: number;
  clickPower: number;
  productionPerSecond: number;
  upgrades: { [upgradeId: string]: number }; // upgradeId -> owned count
  unlockedUpgrades: string[];
  sessionId: string;
  lastSaved: number;
  startTime: number;
  prestigeLevel: number;
  prestigePoints: number;
  prestigeMultiplier: number;
  totalPrestigePoints: number;
  
  // Achievement & Collection System
  achievements: { [achievementId: string]: AchievementProgress };
  unlockedAchievements: string[];
  collectedCandies: { [candyId: string]: CollectibleCandy };
  discoveredCandies: string[];
  totalClicks: number;
  totalFlyingCandiesCaught: number;
  totalPlayTime: number; // in milliseconds
}

export interface ClickEvent {
  x: number;
  y: number;
  damage: number;
  timestamp: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface FloatingNumber {
  id: string;
  x: number;
  y: number;
  value: number;
  timestamp: number;
  color: string;
}

export interface UpgradePurchaseResult {
  success: boolean;
  newPrice?: number;
  newLevel?: number;
  errorMessage?: string;
}

export interface ProductionTick {
  amount: number;
  timestamp: number;
}

export interface FlyingCandy {
  id: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  size: number;
  value: number;
  color: string;
  life: number;
  maxLife: number;
  startTime: number;
}

export interface PrestigeData {
  requiredCandy: number;
  prestigePointsGained: number;
  newMultiplier: number;
  canPrestige: boolean;
}

// Achievement & Collection System Interfaces
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'production' | 'clicking' | 'collection' | 'prestige' | 'discovery' | 'secret';
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  unlockedAt?: number;
  rewards: AchievementReward[];
  requirements: AchievementRequirement[];
  hidden?: boolean; // For secret achievements
}

export interface AchievementRequirement {
  type: 'candy_total' | 'candy_click' | 'production_rate' | 'upgrade_level' | 'prestige_level' | 'collection_count' | 'flying_candy_caught' | 'time_played' | 'custom';
  value: number;
  upgradeId?: string; // For upgrade-specific requirements
  candyType?: string; // For collection requirements
}

export interface AchievementReward {
  type: 'click_multiplier' | 'production_multiplier' | 'candy_bonus' | 'unlock_candy' | 'prestige_bonus' | 'cosmetic';
  value: number;
  candyType?: string; // For candy unlock rewards
  permanent: boolean;
}

export interface CollectibleCandy {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  icon: string;
  color: string;
  discoveredAt?: number;
  count: number; // How many times collected
  source: 'flying' | 'achievement' | 'prestige' | 'special_event';
  passiveBonuses: CandyPassiveBonus[];
}

export interface CandyPassiveBonus {
  type: 'click_power' | 'production_rate' | 'flying_candy_spawn' | 'prestige_bonus' | 'special';
  multiplier: number;
  description: string;
}

export interface AchievementProgress {
  achievementId: string;
  currentProgress: number;
  completed: boolean;
  completedAt?: number;
}

export interface CollectionStats {
  totalDiscovered: number;
  totalCollected: number;
  rarityBreakdown: {
    common: number;
    rare: number;
    epic: number;
    legendary: number;
    mythic: number;
  };
  completionPercentage: number;
}