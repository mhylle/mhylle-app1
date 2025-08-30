/**
 * Cross-Planet Features: Recipes & Trading System
 * Advanced integration systems that connect all planets
 */

import { PlanetType, ResourceType } from './planet-system.interface';

/**
 * Comprehensive cross-planet recipe database
 */
export interface CrossPlanetRecipeDatabase {
  tier1Recipes: Tier1Recipe[]; // 2 planets required
  tier2Recipes: Tier2Recipe[]; // 3 planets required  
  tier3Recipes: Tier3Recipe[]; // 4+ planets required
  ultimateRecipes: UltimateRecipe[]; // All 6 planets required
}

/**
 * Tier 1 Recipes: 2-Planet Combinations
 */
export interface Tier1Recipe {
  // Sweet & Sour Symphony
  sweetSourSymphony: {
    id: 'sweet_sour_symphony';
    name: 'Sweet & Sour Symphony';
    description: 'Perfect harmony of honey sweetness and citrus tang';
    ingredients: [
      { planet: 'sweet', resource: 'sweetness', amount: 100 },
      { planet: 'sour', resource: 'acid', amount: 50 }
    ];
    result: {
      type: 'multiplier';
      value: 1.15; // +15% production on both planets
      duration: 300000; // 5 minutes
      description: 'Flavor balance bonus: +15% production on Sweet and Sour planets';
    };
    discoveryRequirements: {
      planetsUnlocked: ['sweet', 'sour'];
      totalCandyThreshold: 50000;
    };
  };

  // Fire & Ice Contrast
  fireIceContrast: {
    id: 'fire_ice_contrast';
    name: 'Fire & Ice Contrast';
    description: 'Thermal crystals meet arctic preservation for perfect temperature control';
    ingredients: [
      { planet: 'spicy', resource: 'thermal', amount: 75 },
      { planet: 'cold', resource: 'crystal', amount: 25 }
    ];
    result: {
      type: 'permanent_bonus';
      value: 1.0; // Unlocks temperature regulation technology
      description: 'Temperature Regulation: Prevents overheating and over-cooling penalties';
    };
    discoveryRequirements: {
      planetsUnlocked: ['spicy', 'cold'];
      specificAchievements: ['heat_master', 'crystal_collector'];
    };
  };

  // Bubble Burst Delight  
  bubbleBurstDelight: {
    id: 'bubble_burst_delight';
    name: 'Bubble Burst Delight';
    description: 'Effervescent bubbles enhanced with golden caramel sweetness';
    ingredients: [
      { planet: 'fizzy', resource: 'pressure', amount: 80 },
      { planet: 'sweet', resource: 'sugar', amount: 60 }
    ];
    result: {
      type: 'special_ability';
      value: 1.25; // +25% more frequent celebration events
      description: 'Celebration Cascade: Cross-planet party mode with synchronized bonuses';
    };
    discoveryRequirements: {
      planetsUnlocked: ['fizzy', 'sweet'];
      totalCandyThreshold: 500000;
    };
  };
}

/**
 * Tier 2 Recipes: 3-Planet Strategic Combinations
 */
export interface Tier2Recipe {
  // Tropical Paradise Fusion
  tropicalParadiseFusion: {
    id: 'tropical_paradise_fusion';
    name: 'Tropical Paradise Fusion';
    description: 'Sweet honey, sour citrus, and spicy heat create paradise flavors';
    ingredients: [
      { planet: 'sweet', resource: 'sweetness', amount: 150 },
      { planet: 'sour', resource: 'fermentation', amount: 100 },
      { planet: 'spicy', resource: 'heat', amount: 200 }
    ];
    result: {
      type: 'multiplier';
      value: 1.30; // +30% production across all contributing planets
      duration: 600000; // 10 minutes
      description: 'Paradise Mode: Tropical visual theme + production bonus';
    };
    discoveryRequirements: {
      planetsUnlocked: ['sweet', 'sour', 'spicy'];
      specificAchievements: ['flavor_harmony', 'heat_control'];
    };
  };

  // Arctic Adventure Mix
  arcticAdventureMix: {
    id: 'arctic_adventure_mix';
    name: 'Arctic Adventure Mix';
    description: 'Ice crystals, celebration bubbles, and honey base for winter magic';
    ingredients: [
      { planet: 'cold', resource: 'crystal', amount: 120 },
      { planet: 'fizzy', resource: 'celebration', amount: 80 },
      { planet: 'sweet', resource: 'energy', amount: 100 }
    ];
    result: {
      type: 'permanent_bonus';
      value: 1.0; // Ice Age events provide bonuses instead of penalties
      description: 'Winter Mastery: Seasonal events become beneficial across all planets';
    };
    discoveryRequirements: {
      planetsUnlocked: ['cold', 'fizzy', 'sweet'];
      specificAchievements: ['aurora_witness', 'celebration_master'];
    };
  };

  // Gourmet Experience
  gourmetExperience: {
    id: 'gourmet_experience';
    name: 'Gourmet Experience';
    description: 'Bitter complexity enhanced by sweet refinement and cold preservation';
    ingredients: [
      { planet: 'bitter', resource: 'sophistication', amount: 200 },
      { planet: 'sweet', resource: 'sugar', amount: 150 },
      { planet: 'cold', resource: 'preservation', amount: 100 }
    ];
    result: {
      type: 'permanent_bonus';
      value: 2.0; // All candies gain "gourmet" quality tier with 2x base value
      description: 'Master Confectioner: Unlocks exclusive gourmet progression path';
    };
    discoveryRequirements: {
      planetsUnlocked: ['bitter', 'sweet', 'cold'];
      specificAchievements: ['complexity_master', 'preservation_expert'];
    };
  };
}

/**
 * Tier 3 Recipes: Master-Level 4+ Planet Coordination
 */
export interface Tier3Recipe {
  // Elemental Harmony Quadfecta
  elementalHarmonyQuadfecta: {
    id: 'elemental_harmony_quadfecta';
    name: 'Elemental Harmony Quadfecta';
    description: 'Perfect balance of sweet, sour, hot, and cold elements';
    ingredients: [
      { planet: 'sweet', resource: 'sweetness', amount: 250 },
      { planet: 'sour', resource: 'acid', amount: 200 },
      { planet: 'spicy', resource: 'heat', amount: 300 },
      { planet: 'cold', resource: 'cooling', amount: 150 }
    ];
    result: {
      type: 'multiplier';
      value: 1.50; // +50% production across all 4 contributing planets
      duration: 900000; // 15 minutes
      description: 'Elemental Mastery: Unlocks advanced planetary coordination abilities';
    };
    discoveryRequirements: {
      planetsUnlocked: ['sweet', 'sour', 'spicy', 'cold'];
      specificAchievements: ['temperature_master', 'flavor_specialist'];
    };
  };

  // Cosmic Complexity Integration
  cosmicComplexityIntegration: {
    id: 'cosmic_complexity_integration';
    name: 'Cosmic Complexity Integration';
    description: 'Bitter sophistication amplifies and coordinates all planetary systems';
    ingredients: [
      { planet: 'bitter', resource: 'analysis', amount: 400 },
      { planet: 'sweet', resource: 'energy', amount: 200 },
      { planet: 'sour', resource: 'electric', amount: 150 },
      { planet: 'fizzy', resource: 'network', amount: 100 }
    ];
    result: {
      type: 'special_ability';
      value: 1.0; // Unlocks automated optimization for all planets
      description: 'Cosmic Intelligence: AI-assisted optimization across entire solar system';
    };
    discoveryRequirements: {
      planetsUnlocked: ['bitter', 'sweet', 'sour', 'fizzy'];
      specificAchievements: ['master_analyst', 'network_coordinator'];
    };
  };
}

/**
 * Ultimate Recipes: All 6 Planets Required
 */
export interface UltimateRecipe {
  // Cosmic Candy Perfection
  cosmicCandyPerfection: {
    id: 'cosmic_candy_perfection';
    name: 'Cosmic Candy Perfection';
    description: 'The ultimate confection combining all planetary specialties';
    ingredients: [
      { planet: 'sweet', resource: 'sweetness', amount: 500 },
      { planet: 'sour', resource: 'fermentation', amount: 400 },
      { planet: 'cold', resource: 'crystal', amount: 300 },
      { planet: 'spicy', resource: 'catalyst', amount: 350 },
      { planet: 'bitter', resource: 'complexity', amount: 600 },
      { planet: 'fizzy', resource: 'celebration', amount: 250 }
    ];
    result: {
      type: 'permanent_bonus';
      value: 2.0; // +100% production across entire solar system permanently
      description: 'Cosmic Mastery: Unlocks ultimate prestige tier and unique ending';
    };
    discoveryRequirements: {
      planetsUnlocked: ['sweet', 'sour', 'cold', 'spicy', 'bitter', 'fizzy'];
      specificAchievements: ['planetary_master', 'cosmic_industrialist'];
      totalCandyThreshold: 10000000; // 10 million candy across all planets
    };
  };
}

/**
 * Resource trading route configurations
 */
export interface TradeRouteConfiguration {
  // Standard efficiency routes
  standardRoutes: {
    sweetToSour: { // Sugar for pH balance
      efficiency: 0.8;
      conversionRate: 2; // 2 sugar = 1 acid neutralization
      autoTradeThreshold: 50;
    };
    spicyToCold: { // Heat for crystallization
      efficiency: 0.7;
      conversionRate: 3; // 3 heat = 1 crystallization boost
      autoTradeThreshold: 75;
    };
    coldToSpicy: { // Cooling for overheat protection
      efficiency: 0.9;
      conversionRate: 1; // 1 cooling = 1 heat removal
      autoTradeThreshold: 90; // Emergency cooling
    };
    bitterToAll: { // Analysis tools boost all planets
      efficiency: 1.0;
      conversionRate: 0.1; // Small amounts, big impact
      autoTradeThreshold: 100;
    };
    fizzyToAll: { // Celebration triggers cross-planet bonuses
      efficiency: 0.6;
      conversionRate: 1;
      autoTradeThreshold: 80;
    };
  };

  // Advanced efficiency routes (unlocked through achievements)
  advancedRoutes: {
    sweetSourLoop: { // Circular sweetness-acid optimization
      unlockRequirement: 'ph_balance_master';
      efficiency: 0.95;
      description: 'Optimized pH maintenance with minimal resource loss';
    };
    thermalRegulation: { // Hot-cold automated temperature control
      unlockRequirement: 'temperature_control_expert';
      efficiency: 0.9;
      description: 'Automated temperature management prevents penalties';
    };
    networkSynergy: { // All planets contribute to shared resource pool
      unlockRequirement: 'cosmic_coordinator';
      efficiency: 1.1; // Better than 100% through synergy
      description: 'Network effects create more resources than consumed';
    };
  };
}

/**
 * Cross-planet achievement integration
 */
export interface CrossPlanetAchievements {
  // Multi-planet coordination achievements
  coordination: {
    'dual_planet_master': {
      description: 'Maintain 2 planets simultaneously for 30 minutes';
      reward: { type: 'network_bonus', value: 1.1 };
    };
    'tri_planet_coordinator': {
      description: 'Successfully complete 5 Tier-2 recipes';
      reward: { type: 'recipe_efficiency', value: 1.15 };
    };
    'quad_planet_orchestrator': {
      description: 'Maintain 4+ planet network for 1 hour';
      reward: { type: 'synergy_multiplier', value: 1.25 };
    };
    'cosmic_empire_manager': {
      description: 'All 6 planets active with optimal efficiency';
      reward: { type: 'ultimate_bonus', value: 1.5 };
    };
  };

  // Recipe mastery achievements
  recipes: {
    'flavor_harmony_specialist': {
      description: 'Complete 10 different cross-planet recipes';
      reward: { type: 'recipe_discovery_rate', value: 1.3 };
    };
    'master_chef_cosmic': {
      description: 'Perfect execution on 25 Tier-2+ recipes';
      reward: { type: 'ingredient_efficiency', value: 1.2 };
    };
    'ultimate_confectioner': {
      description: 'Complete "Cosmic Candy Perfection" recipe';
      reward: { type: 'prestige_tier_unlock', value: 'cosmic_mastery' };
    };
  };

  // Trading network achievements
  trading: {
    'resource_flow_master': {
      description: 'Establish 10+ automated trade routes';
      reward: { type: 'trade_efficiency', value: 1.15 };
    };
    'supply_chain_optimizer': {
      description: 'Achieve 95%+ efficiency on all trade routes';
      reward: { type: 'resource_generation', value: 1.25 };
    };
    'cosmic_merchant': {
      description: 'Trade 1 million total resources between planets';
      reward: { type: 'trade_volume_bonus', value: 1.1 };
    };
  };
}

/**
 * Network synergy calculation formulas
 */
export interface NetworkSynergyFormulas {
  // Base synergy by number of active planets
  baseSynergy: {
    2: 1.10; // +10% when 2 planets active
    3: 1.20; // +20% when 3 planets active  
    4: 1.35; // +35% when 4 planets active
    5: 1.55; // +55% when 5 planets active
    6: 1.80; // +80% when all 6 planets active
  };

  // Specialized connection bonuses
  connectionBonuses: {
    sweetSourConnection: 0.05; // pH balance automation
    hotColdConnection: 0.08; // Temperature regulation
    fizzyNetworkConnection: 0.12; // Celebration cascades
    bitterIntegrationConnection: 0.15; // Efficiency analysis
  };

  // Time-based synergy multipliers
  sustainedNetworkBonus: {
    5: 1.02; // +2% bonus after 5 minutes
    15: 1.05; // +5% bonus after 15 minutes
    30: 1.08; // +8% bonus after 30 minutes
    60: 1.12; // +12% bonus after 1 hour
    180: 1.20; // +20% bonus after 3 hours
  };
}