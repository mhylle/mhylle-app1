/**
 * Planet-Specific Mechanics Interfaces
 * Detailed mechanics for each of the 6 specialized planets
 */

import { PlanetType, ResourceType } from './planet-system.interface';

/**
 * Sweet Planet: Sweetness Accumulation System
 * Tutorial planet with progressive complexity and combo multipliers
 */
export interface SweetPlanetMechanics {
  // Core sweetness system
  sweetnessLevel: number; // 0-100, triggers Sugar Rush at 100
  sweetnessRate: number; // Accumulation per second
  maxSweetnessRate: number; // Cap based on upgrades
  
  // Sugar Rush event system
  sugarRush: {
    active: boolean;
    multiplier: number; // 2x to 5x based on sweetness quality
    endTime?: number; // When current rush ends
    cooldownEndTime?: number; // Prevent rapid successive rushes
    totalRushes: number;
    bestRushMultiplier: number;
  };
  
  // Honey reservoir system (late-game feature)
  honeyReservoir: {
    level: number; // Accumulated honey for passive bonuses
    capacity: number; // Max storage based on upgrades
    passiveBonus: number; // Current passive production multiplier
    drainRate: number; // Natural honey consumption per second
  };
  
  // Crystal gardens (endgame feature)
  crystalGardens: {
    unlocked: boolean;
    gardens: Array<{
      id: string;
      size: number; // Production area
      sweetnessCost: number; // Cost to maintain
      productionBonus: number; // Multiplier contribution
      crystalType: 'golden' | 'amber' | 'diamond'; // Visual and bonus tier
    }>;
    totalCrystalProduction: number;
  };
  
  // Sweet-specific candy types
  candyTypes: {
    goldenHoneyDrops: { discovered: boolean; count: number };
    sugarCrystals: { discovered: boolean; count: number };
    caramelSwirls: { discovered: boolean; count: number };
  };
}

/**
 * Sour Planet: pH Balance System
 * Resource management with risk/reward balance optimization
 */
export interface SourPlanetMechanics {
  // pH balance core system
  phLevel: number; // 3.0 (very acidic) to 7.0 (neutral)
  optimalPhRange: [number, number]; // [5.0, 6.0] for peak efficiency
  naturalAcidification: number; // pH drift toward acidic per minute
  
  // Production efficiency based on pH
  productionModifier: number; // 0.2 to 1.5 based on pH level
  currentEfficiencyRating: 'poor' | 'fair' | 'good' | 'optimal' | 'excellent';
  
  // Resource import system (pH management)
  sugarImports: {
    available: number; // Sugar imported from Sweet planet
    consumptionRate: number; // Sugar used per second for pH balance
    effectiveness: number; // How much pH change per sugar unit
    autoBalance: boolean; // Automatic pH management enabled
  };
  
  // Fermentation process (time-based value increases)
  fermentation: {
    unfermentedCandy: number; // Fresh candy waiting to ferment
    fermentingCandy: Array<{
      amount: number;
      startTime: number;
      fermentationTime: number; // Duration for max value
      currentMultiplier: number; // 1x to 5x based on time
    }>;
    totalFermentedValue: number;
    fermentationEfficiency: number; // Upgrade-based improvement
  };
  
  // Acid rain events (random pH-based events)
  acidRainEvents: {
    active: boolean;
    eventType: 'beneficial' | 'harmful' | 'neutral';
    endTime?: number;
    effectMultiplier: number;
    totalEvents: number;
    preparednessBonus: number; // Bonus when pH is optimal during event
  };
  
  // Citrus cascade system (chain reactions)
  citrusCascade: {
    active: boolean;
    cascadeMultiplier: number; // Bonus from chain reactions
    cascadeLength: number; // Number of candies in current cascade
    maxCascadeLength: number; // Record cascade
    totalCascades: number;
  };
  
  // Sour-specific candy types
  candyTypes: {
    fizzingSourDrops: { discovered: boolean; count: number };
    citricCrystals: { discovered: boolean; count: number };
    fermentedDelights: { discovered: boolean; count: number };
  };
}

/**
 * Cold Planet: Temperature Management & Preservation
 * Long-term strategy with patience-based high-value rewards
 */
export interface ColdPlanetMechanics {
  // Temperature management
  temperature: number; // -50°C to 0°C
  optimalRange: [number, number]; // [-35, -20] for best crystallization
  coolingRate: number; // Temperature decrease per second (with upgrades)
  heatLoss: number; // Natural temperature drift toward -10°C
  
  // Production vs preservation tradeoff
  productionRate: number; // Slower at lower temperatures
  preservationValue: number; // Higher value at lower temperatures
  temperatureModifier: number; // Current production speed multiplier
  valueModifier: number; // Current candy value multiplier
  
  // Crystallization system
  crystallization: {
    threshold: number; // Temperature for auto-crystallization (-30°C default)
    regularCandy: number; // Normal candy awaiting crystallization
    crystallizedCandy: number; // High-value preserved candy (10x value)
    crystallizationRate: number; // Conversion rate when threshold met
    totalCrystallized: number;
  };
  
  // Ice age cycles (dramatic environmental events)
  iceAge: {
    active: boolean;
    cyclePhase: 'warming' | 'cooling' | 'stable';
    phaseEndTime?: number;
    temperatureShift: number; // Additional temperature modifier
    adaptationBonus: number; // Bonus for preparation
    totalCycles: number;
  };
  
  // Crystal caverns (underground expansion)
  crystalCaverns: {
    unlocked: boolean;
    depth: number; // Deeper = colder = more valuable
    excavationProgress: number; // Progress toward next depth level
    cavernProduction: number; // Additional production from caverns
    uniqueCrystals: Array<{
      type: 'ice' | 'frost' | 'diamond';
      rarity: 'common' | 'rare' | 'legendary';
      value: number;
      discoveredAt: number;
    }>;
  };
  
  // Aurora events (beautiful light shows with bonuses)
  auroraEvents: {
    active: boolean;
    auroraType: 'northern' | 'southern' | 'cosmic';
    intensity: number; // 1-10, affects bonus magnitude
    endTime?: number;
    planetWideBonus: number; // Production bonus during aurora
    totalAuroraTime: number;
  };
  
  // Cold-specific candy types
  candyTypes: {
    iceCrystals: { discovered: boolean; count: number };
    frozenDelights: { discovered: boolean; count: number };
    auroraEssence: { discovered: boolean; count: number };
  };
}

/**
 * Spicy Planet: Heat Engine System
 * High-risk, high-reward with exponential scaling and overheat management
 */
export interface SpicyPlanetMechanics {
  // Heat engine core system
  heatLevel: number; // 0-100, exponential production scaling
  heatBuildup: number; // Heat per second during active production
  coolingRate: number; // Natural heat dissipation per second
  overheatThreshold: number; // 100 default, upgradeable
  
  // Exponential production scaling
  productionMultiplier: number; // 1.05^heatLevel, massive at high heat
  riskLevel: 'safe' | 'moderate' | 'dangerous' | 'critical'; // Visual warnings
  
  // Overheat penalty system
  overheat: {
    active: boolean;
    cooldownEndTime?: number; // 60 seconds default
    penaltyMultiplier: number; // 0.5x production during cooldown
    candyLoss: number; // 50% candy lost on overheat
    totalOverheats: number;
    longestHeatStreak: number; // Max heat level achieved without overheat
  };
  
  // Heat redistribution (advanced strategy)
  heatRedistribution: {
    unlocked: boolean;
    thermalZones: Array<{
      id: string;
      heatLevel: number;
      efficiency: number; // Production per heat unit
      connected: boolean; // Sharing heat with other zones
    }>;
    redistributionRate: number; // Heat transfer per second
    optimalConfiguration: boolean; // All zones balanced
  };
  
  // Volcanic activity (unpredictable events)
  volcanicActivity: {
    active: boolean;
    activityType: 'eruption' | 'thermal_vent' | 'lava_flow';
    riskLevel: number; // 1-10, higher = more reward and danger
    endTime?: number;
    emergencyShutdown: boolean; // Auto-cool to prevent overheat
    totalVolcanicEvents: number;
  };
  
  // Magma chambers (deep planetary features)
  magmaChambers: {
    unlocked: boolean;
    chambers: Array<{
      depth: number; // Deeper = hotter = more production
      pressure: number; // Affects eruption risk
      capacity: number; // Max heat storage
      productionBonus: number;
    }>;
    totalMagmaProduction: number;
  };
  
  // Heat export system (to Cold planet)
  heatExport: {
    exportRate: number; // Heat units per second
    efficiency: number; // How much cold planet benefits
    totalHeatExported: number;
    recipientPlanet: 'cold' | null;
  };
  
  // Spicy-specific candy types
  candyTypes: {
    firePeppers: { discovered: boolean; count: number };
    moltenCores: { discovered: boolean; count: number };
    thermalCrystals: { discovered: boolean; count: number };
  };
}

/**
 * Bitter Planet: Complexity & Sophistication System
 * Advanced gameplay requiring mastery of multiple planetary systems
 */
export interface BitterPlanetMechanics {
  // Complexity scaling system
  complexityLevel: number; // 0-infinity, increases with successful recipes
  sophisticationMultiplier: number; // Production bonus from complexity mastery
  acquiredTasteProgress: number; // 0-100, unlocks advanced features
  
  // Master chef mode (advanced recipe system)
  masterChef: {
    unlocked: boolean;
    activeRecipe: string | null; // Current recipe being crafted
    recipeProgress: number; // 0-100 completion
    ingredients: Array<{
      planetSource: PlanetType;
      resourceType: ResourceType;
      required: number;
      collected: number;
    }>;
    perfectRecipes: number; // Recipes completed with 100% precision
    masterpieces: Array<{
      recipeId: string;
      complexity: number;
      completedAt: number;
      permanentBonus: number;
    }>;
  };
  
  // Sophistication engine (complexity-based production bonuses)
  sophisticationEngine: {
    engineLevel: number; // Upgrade level of the sophistication systems
    efficiencyRating: number; // 0-100, based on recipe completion success
    catalystProduction: number; // Special materials generated from complexity
    optimizationSuggestions: Array<{
      planetId: PlanetType;
      suggestion: string;
      potentialImprovement: number;
    }>;
  };
  
  // Gourmet gallery (showcase for masterpieces)
  gourmetGallery: {
    unlocked: boolean;
    displayedMasterpieces: Array<{
      recipeId: string;
      displayName: string;
      permanentBonus: number;
      visualTier: 'bronze' | 'silver' | 'gold' | 'platinum';
    }>;
    galleryBonus: number; // Total permanent bonus from all displayed pieces
    visitorAppreciation: number; // Aesthetic bonus from gallery arrangement
  };
  
  // Cross-planet analysis tools
  analysisTools: {
    unlocked: boolean;
    planetEfficiency: { [planetId: string]: number };
    optimizationRecommendations: Array<{
      planetId: PlanetType;
      recommendation: string;
      estimatedImprovement: number;
    }>;
    totalAnalysesPerformed: number;
    accuracyRating: number; // How often recommendations help
  };
  
  // Bitter-specific candy types
  candyTypes: {
    darkCacaoSpheres: { discovered: boolean; count: number };
    complexityCatalysts: { discovered: boolean; count: number };
    gourmetMasterpieces: { discovered: boolean; count: number };
  };
}

/**
 * Fizzy Planet: Pressure Systems & Timing-Based Rewards
 * Dynamic gameplay with burst production and celebration mechanics
 */
export interface FizzyPlanetMechanics {
  // Pressure system core
  pressureLevel: number; // 0-100, builds over time
  pressureBuildupRate: number; // Pressure per second
  maxPressure: number; // Upgradeable ceiling
  optimalReleaseRange: [number, number]; // [70, 90] for best results
  
  // Controlled pressure release system
  pressureRelease: {
    available: boolean; // Can trigger release
    burstMultiplier: number; // Production bonus from release (2x to 10x)
    celebrationDuration: number; // How long the bonus lasts
    cooldownTime: number; // Time before next release possible
    perfectReleases: number; // Releases in optimal range
    totalReleases: number;
  };
  
  // Pop festivals (timed events with celebration themes)
  popFestivals: {
    active: boolean;
    festivalType: 'bubble_party' | 'effervescence_explosion' | 'cosmic_celebration';
    participationLevel: number; // How well player is doing in event
    festivalEndTime?: number;
    celebrationMultiplier: number; // Global bonus during festival
    totalFestivalsParticipated: number;
    bestFestivalScore: number;
  };
  
  // Effervescence cascades (chain reaction bonuses)
  effervescenceCascades: {
    active: boolean;
    cascadeLevel: number; // Number of connected celebrations
    maxCascadeLevel: number; // Record cascade achieved
    cascadeMultiplier: number; // Total bonus from cascade
    cascadeDuration: number; // How long cascade lasts
    totalCascades: number;
  };
  
  // Bubble networks (connected pressure systems)
  bubbleNetworks: {
    unlocked: boolean;
    networks: Array<{
      id: string;
      connectedSystems: number; // How many pressure systems linked
      coordinatedReleases: number; // Simultaneous releases for mega-bonus
      networkEfficiency: number; // How well synchronized the network is
    }>;
    crossPlanetNetworking: boolean; // Can trigger celebrations on other planets
  };
  
  // Carbonation systems (pressure generation technology)
  carbonationSystems: {
    systemLevel: number; // Upgrade level of carbonation technology
    carbonationRate: number; // How fast pressure builds
    pressureEfficiency: number; // Better conversion of pressure to production
    safetyProtocols: boolean; // Prevents catastrophic over-pressure
    totalCarbonationGenerated: number;
  };
  
  // Cross-planet celebration triggering
  celebrationTriggers: {
    canTriggerOnOtherPlanets: boolean;
    lastTriggeredPlanet: PlanetType | null;
    celebrationEnergy: number; // Energy available for triggering
    crossPlanetCelebrations: number;
  };
  
  // Fizzy-specific candy types
  candyTypes: {
    bubbleBursts: { discovered: boolean; count: number };
    pressureCrystals: { discovered: boolean; count: number };
    celebrationConfetti: { discovered: boolean; count: number };
  };
}

/**
 * Planet mechanics factory for creating default mechanics
 */
export interface PlanetMechanicsFactory {
  createSweetMechanics(): SweetPlanetMechanics;
  createSourMechanics(): SourPlanetMechanics;
  createColdMechanics(): ColdPlanetMechanics;
  createSpicyMechanics(): SpicyPlanetMechanics;
  createBitterMechanics(): BitterPlanetMechanics;
  createFizzyMechanics(): FizzyPlanetMechanics;
}

/**
 * Type union for all planet-specific mechanics
 */
export type PlanetSpecificMechanics = 
  | SweetPlanetMechanics
  | SourPlanetMechanics
  | ColdPlanetMechanics
  | SpicyPlanetMechanics
  | BitterPlanetMechanics
  | FizzyPlanetMechanics;