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