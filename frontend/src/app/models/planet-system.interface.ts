/**
 * Multi-Planet System Interfaces
 * Core data structures for the 6-planet cosmic candy factory system
 */

// Planet type enumeration
export type PlanetType = 'sweet' | 'sour' | 'cold' | 'spicy' | 'bitter' | 'fizzy';

// Resource types for cross-planet trading
export type ResourceType = 
  | 'sugar' | 'sweetness' | 'energy'           // Sweet planet exports
  | 'acid' | 'fermentation' | 'electric'       // Sour planet exports
  | 'cooling' | 'preservation' | 'crystal'     // Cold planet exports
  | 'heat' | 'catalyst' | 'thermal'            // Spicy planet exports
  | 'complexity' | 'analysis' | 'sophistication' // Bitter planet exports
  | 'pressure' | 'celebration' | 'network';    // Fizzy planet exports

/**
 * Core state for an individual planet
 */
export interface PlanetState {
  id: PlanetType;
  unlocked: boolean;
  unlockedAt?: number; // Timestamp when planet was unlocked
  
  // Core game mechanics (mirrors original GameState)
  candy: number;
  clickPower: number;
  productionPerSecond: number;
  upgrades: { [upgradeId: string]: number };
  unlockedUpgrades: string[];
  
  // Planet-specific special mechanics
  specialMechanics: PlanetSpecialMechanics;
  
  // Resource trading system
  resources: {
    exports: { [resourceType: string]: number }; // Available to trade away
    imports: { [resourceType: string]: number }; // Received from other planets
  };
  
  // Planet-specific achievements and collections
  achievements: { [achievementId: string]: boolean };
  discoveredCandies: string[];
  
  // Performance and activity tracking
  lastActive: number; // Timestamp of last player interaction
  totalTimeActive: number; // Total milliseconds player spent on this planet
  totalClicks: number; // Planet-specific click count
}

/**
 * Planet-specific mechanics for each world type
 */
export interface PlanetSpecialMechanics {
  // Sweet Planet: Sweetness Accumulation System
  sweetness?: {
    level: number; // 0-100, triggers Sugar Rush at 100
    accumationRate: number; // Sweetness per second
    sugarRushActive: boolean;
    sugarRushEndTime?: number;
    totalSugarRushes: number;
  };
  
  // Sour Planet: pH Balance System  
  phBalance?: {
    level: number; // 3.0 to 7.0, optimal around 5.5
    naturalAcidification: number; // pH drift per minute
    productionModifier: number; // Current production multiplier based on pH
    totalAcidEvents: number;
  };
  
  // Cold Planet: Temperature Management (simplified)
  temperature?: {
    level: number; // -50°C to 0°C
    crystallizationThreshold: number; // Temperature for auto-crystallization
    crystallizedCandy: number; // High-value preserved candy
    totalCrystallizations: number;
  };
  
  // Cold Planet: Full mechanics (for specialized component)
  coldMechanics?: any; // Import from planet-mechanics.interface.ts to avoid circular dependency
  
  // Spicy Planet: Full mechanics (for specialized component)
  spicyMechanics?: any; // Import from planet-mechanics.interface.ts to avoid circular dependency
  
  // Spicy Planet: Heat Engine System (legacy - use spicyMechanics for full functionality)
  heat?: {
    level: number; // 0-100, risk of overheat at 100
    buildup: number; // Heat per second when active
    overheatCooldown?: number; // Timestamp when overheat penalty ends
    totalOverheats: number;
  };
  
  // Bitter Planet: Complexity Scaling
  complexity?: {
    level: number; // 0-infinity, increases with successful recipes
    sophisticationMultiplier: number; // Production bonus from complexity
    masterRecipesCompleted: number;
    totalComplexityGained: number;
  };
  
  // Fizzy Planet: Pressure Systems
  pressure?: {
    level: number; // 0-100, controlled release for bonuses
    burstPotential: number; // Multiplier available from pressure release
    lastBurstTime?: number;
    totalBursts: number;
  };
}

/**
 * Cross-planet recipe system
 */
export interface CrossPlanetRecipe {
  id: string;
  name: string;
  description: string;
  tier: 1 | 2 | 3; // Complexity level
  
  // Recipe requirements
  ingredients: {
    planet: PlanetType;
    resource: ResourceType;
    amount: number;
  }[];
  
  // Recipe rewards
  result: {
    type: 'multiplier' | 'unlock' | 'permanent_bonus' | 'special_ability';
    value: number;
    description: string;
    duration?: number; // For temporary bonuses (milliseconds)
  };
  
  // Discovery and completion tracking
  discovered: boolean;
  discoveredAt?: number;
  completedCount: number;
  firstCompletedAt?: number;
  
  // Requirements to discover this recipe
  discoveryRequirements: {
    planetsUnlocked: PlanetType[];
    totalCandyThreshold?: number;
    specificAchievements?: string[];
  };
}

/**
 * Resource trading routes between planets
 */
export interface TradeRoute {
  id: string;
  fromPlanet: PlanetType;
  toPlanet: PlanetType;
  resourceType: ResourceType;
  
  // Trading parameters
  rate: number; // Units per second
  efficiency: number; // 0.5 to 1.0 based on technology upgrades
  automatic: boolean; // Auto-trade when conditions met
  
  // Activation conditions
  conditions: {
    minResourceLevel?: number; // Only trade if source has enough
    maxResourceLevel?: number; // Only trade if destination needs it
    planetActive?: boolean; // Only trade if destination planet is active
  };
  
  // Statistics
  totalResourcesTraded: number;
  createdAt: number;
  lastTradeTime?: number;
}

/**
 * Planet unlock progression tracking
 */
export interface PlanetUnlockProgress {
  planetId: PlanetType;
  
  // Three-track unlock system (choose 2 of 3)
  tracks: {
    efficiency: PlanetUnlockTrack;
    explorer: PlanetUnlockTrack;
    persistence: PlanetUnlockTrack;
  };
  
  // Overall unlock status
  unlocked: boolean;
  tracksCompleted: ('efficiency' | 'explorer' | 'persistence')[];
  unlockedAt?: number;
  celebrationShown: boolean;
}

/**
 * Individual unlock track progress
 */
export interface PlanetUnlockTrack {
  completed: boolean;
  completedAt?: number;
  progress: number; // 0.0 to 1.0
  
  // Track-specific requirements
  requirements: PlanetUnlockRequirement[];
  
  // Estimated completion time
  estimatedTimeToComplete?: string;
}

/**
 * Specific unlock requirements
 */
export interface PlanetUnlockRequirement {
  id: string;
  type: 'production_rate' | 'total_candy' | 'achievements' | 'recipes' | 'playtime' | 'planet_mastery';
  description: string;
  
  // Requirement parameters
  targetValue: number;
  currentValue: number;
  completed: boolean;
  
  // Optional specific requirements
  planetId?: PlanetType; // For planet-specific requirements
  achievementIds?: string[]; // For achievement-based requirements
  recipeIds?: string[]; // For recipe-based requirements
}

/**
 * Network synergy system - bonuses from multiple active planets
 */
export interface NetworkSynergy {
  // Current network state
  activePlanets: PlanetType[]; // Planets that contribute to network
  synergyLevel: number; // 1.0 to 2.0+ based on active planets
  
  // Synergy bonuses
  bonuses: {
    productionMultiplier: number; // Bonus to all planet production
    clickPowerMultiplier: number; // Bonus to all click power
    resourceGenerationBonus: number; // Bonus to resource generation
    recipeEfficiencyBonus: number; // Bonus to cross-planet recipes
  };
  
  // Specialized network connections
  connections: {
    sweetSour?: boolean; // pH balance automation
    hotCold?: boolean; // Temperature regulation
    fizzyNetwork?: boolean; // Celebration cascades
    bitterIntegration?: boolean; // Efficiency analysis
  };
  
  // Network statistics
  totalNetworkTime: number; // Time spent with 2+ planets active
  maxSimultaneousPlanets: number; // Highest number of planets active at once
  networkUptime: number; // Percentage of total playtime with network active
}

/**
 * Enhanced game state extending the original single-planet GameState
 * Includes all original GameState fields for backward compatibility
 */
export interface EnhancedGameState {
  // Legacy single-planet fields (maintained for backward compatibility)
  // These sync with the current planet's state
  candy: number;
  totalCandyEarned: number;
  clickPower: number;
  productionPerSecond: number;
  upgrades: { [upgradeId: string]: number };
  unlockedUpgrades: string[];
  totalClicks: number;
  totalFlyingCandiesCaught: number;
  
  // Core game progression (preserved from original)
  sessionId: string;
  lastSaved: number;
  startTime: number;
  totalPlayTime: number;
  
  // Session validation (from original)
  sessionStartTime?: number;
  sessionStartCandyAmount?: number;
  lastUserInteraction?: number;
  
  // Prestige system (enhanced for cosmic level)
  prestigeLevel: number;
  prestigePoints: number;
  prestigeMultiplier: number;
  totalPrestigePoints: number;
  cosmicPrestigeLevel: number; // New: Multi-planet prestige tier
  
  // Multi-planet system core
  planets: { [planetId in PlanetType]: PlanetState };
  currentPlanet: PlanetType;
  lastPlanetSwitch: number;
  
  // Solar system progression
  solarSystemLevel: number; // Overall cosmic progression (1-100+)
  totalCandyAcrossAllPlanets: number;
  totalClicksAcrossAllPlanets: number;
  
  // Cross-planet features
  crossPlanetRecipes: { [recipeId: string]: CrossPlanetRecipe };
  discoveredRecipes: string[];
  completedRecipes: string[];
  
  // Resource trading network
  tradeRoutes: { [routeId: string]: TradeRoute };
  activeTradeRoutes: string[];
  
  // Network synergy system
  networkSynergy: NetworkSynergy;
  
  // Planet unlock system
  planetUnlockProgress: { [planetId: string]: PlanetUnlockProgress };
  
  // Achievement & Collection System (from original)
  achievements: { [achievementId: string]: {
    achievementId: string;
    currentProgress: number;
    completed: boolean;
    completedAt?: number;
  }};
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
  }};
  discoveredCandies: string[];
  
  // Global achievements (cosmic-level)
  cosmicAchievements: { [achievementId: string]: boolean };
  unlockedCosmicAchievements: string[];
  
  // Additional multi-planet session tracking
  activePlanetSessionTime: { [planetId: string]: number };
  
  // Player preferences and settings
  preferences: {
    autoSwitchPlanets: boolean;
    showNetworkSynergy: boolean;
    enableCelebrationCascades: boolean;
    preferredNavigationMode: 'desktop' | 'mobile' | 'auto';
    autoCollectAll: boolean;
    smartAlerts: boolean;
  };
  
  // Analytics and metrics
  metrics: {
    planetsUnlocked: number;
    recipesDiscovered: number;
    recipesCompleted: number;
    tradeRoutesActive: number;
    averageNetworkSynergyLevel: number;
    totalPlanetSwitches: number;
    favoritePlanet: PlanetType;
    playtimePerPlanet: { [planetId: string]: number };
  };
  
  // Multi-planet compatibility and migration flags
  isMultiPlanet?: boolean; // Flag to detect enhanced game state
  gameVersion?: string; // Version tracking for data migration
}