/**
 * PlanetSystemService - Core Multi-Planet State Management
 * 
 * Central service responsible for:
 * - Managing all 6 planet states
 * - Coordinating cross-planet interactions  
 * - Handling resource trading and recipes
 * - Network synergy calculations
 * - Planet switching and navigation
 * - Data persistence and migration
 */

import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, interval, combineLatest } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

// Import interfaces
import { 
  PlanetType, 
  PlanetState, 
  EnhancedGameState, 
  CrossPlanetRecipe,
  TradeRoute,
  NetworkSynergy,
  PlanetUnlockProgress,
  ResourceType
} from '../models/planet-system.interface';
import { GameState, isEnhancedGameState, MigrationStatus } from '../models/candy-factory.interface';
import { GameApiService } from './game-api.service';
import { AchievementService } from './achievement.service';

@Injectable({
  providedIn: 'root'
})
export class PlanetSystemService implements OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Core state management
  private gameState$ = new BehaviorSubject<EnhancedGameState | null>(null);
  private currentPlanet$ = new BehaviorSubject<PlanetType>('sweet');
  private migrationStatus$ = new BehaviorSubject<MigrationStatus | null>(null);
  
  // Performance optimization - track active/inactive planets
  private activePlanetLastUpdate = 0;
  private inactivePlanetsLastUpdate = 0;
  private readonly INACTIVE_UPDATE_INTERVAL = 1000; // 1 second
  private readonly ACTIVE_UPDATE_INTERVAL = 16; // ~60fps
  
  // Network synergy tracking
  private networkSynergyTimer = 0;
  private lastSynergyCalculation = 0;
  
  constructor(
    private gameApi: GameApiService,
    private achievementService: AchievementService
  ) {
    this.initializeService();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Public observables for components to subscribe to
   */
  get gameState(): Observable<EnhancedGameState | null> {
    return this.gameState$.asObservable();
  }

  get currentPlanet(): Observable<PlanetType> {
    return this.currentPlanet$.asObservable();
  }

  get migrationStatus(): Observable<MigrationStatus | null> {
    return this.migrationStatus$.asObservable();
  }

  /**
   * Get current planet state synchronously (for immediate access)
   */
  getCurrentPlanetState(): PlanetState | null {
    const gameState = this.gameState$.value;
    const currentPlanet = this.currentPlanet$.value;
    return gameState?.planets[currentPlanet] || null;
  }

  /**
   * Get current enhanced game state synchronously
   */
  getCurrentGameState(): EnhancedGameState | null {
    return this.gameState$.value;
  }

  /**
   * Switch to a different planet
   */
  async switchToPlanet(planetId: PlanetType): Promise<boolean> {
    const gameState = this.gameState$.value;
    if (!gameState) return false;

    // Check if planet is unlocked
    if (!gameState.planets[planetId].unlocked) {
      console.warn(`Attempted to switch to locked planet: ${planetId}`);
      return false;
    }

    // Update last active time for current planet
    const currentPlanet = this.currentPlanet$.value;
    if (gameState.planets[currentPlanet]) {
      gameState.planets[currentPlanet].lastActive = Date.now();
    }

    // Switch planet and update metrics
    this.currentPlanet$.next(planetId);
    gameState.currentPlanet = planetId;
    gameState.lastPlanetSwitch = Date.now();
    gameState.metrics.totalPlanetSwitches++;

    // Update playtime tracking
    this.updatePlanetPlaytime(currentPlanet);

    // Trigger save
    await this.saveGameState();
    
    return true;
  }

  /**
   * Initialize a planet (unlock it)
   */
  async unlockPlanet(planetId: PlanetType): Promise<boolean> {
    const gameState = this.gameState$.value;
    if (!gameState || gameState.planets[planetId].unlocked) {
      return false;
    }

    // Mark planet as unlocked
    gameState.planets[planetId].unlocked = true;
    gameState.planets[planetId].unlockedAt = Date.now();
    gameState.metrics.planetsUnlocked++;

    // Update planet unlock progress
    if (gameState.planetUnlockProgress[planetId]) {
      gameState.planetUnlockProgress[planetId].unlocked = true;
      gameState.planetUnlockProgress[planetId].unlockedAt = Date.now();
    }

    // TODO: Trigger achievement check
    // this.achievementService.checkPlanetUnlockAchievements(gameState);

    await this.saveGameState();
    return true;
  }

  /**
   * Execute cross-planet recipe
   */
  async executeRecipe(recipeId: string): Promise<boolean> {
    const gameState = this.gameState$.value;
    if (!gameState) return false;

    const recipe = gameState.crossPlanetRecipes[recipeId];
    if (!recipe || !recipe.discovered) return false;

    // Check if we have sufficient ingredients
    const canExecute = recipe.ingredients.every(ingredient => {
      const planet = gameState.planets[ingredient.planet];
      const availableResource = planet.resources.exports[ingredient.resource] || 0;
      return availableResource >= ingredient.amount;
    });

    if (!canExecute) return false;

    // Consume ingredients
    recipe.ingredients.forEach(ingredient => {
      const planet = gameState.planets[ingredient.planet];
      planet.resources.exports[ingredient.resource] -= ingredient.amount;
    });

    // Apply recipe result
    this.applyRecipeResult(recipe, gameState);

    // Update recipe completion tracking
    recipe.completedCount++;
    if (recipe.completedCount === 1) {
      recipe.firstCompletedAt = Date.now();
    }

    // Add to completed recipes if not already there
    if (!gameState.completedRecipes.includes(recipeId)) {
      gameState.completedRecipes.push(recipeId);
      gameState.metrics.recipesCompleted++;
    }

    await this.saveGameState();
    return true;
  }

  /**
   * Create or update a trade route
   */
  async setupTradeRoute(
    fromPlanet: PlanetType,
    toPlanet: PlanetType,
    resourceType: ResourceType,
    rate: number,
    automatic: boolean = false
  ): Promise<string> {
    const gameState = this.gameState$.value;
    if (!gameState) throw new Error('No game state available');

    const routeId = `${fromPlanet}_to_${toPlanet}_${resourceType}`;
    
    const tradeRoute: TradeRoute = {
      id: routeId,
      fromPlanet,
      toPlanet,
      resourceType,
      rate,
      efficiency: 0.8, // Default efficiency, upgradeable
      automatic,
      conditions: {
        minResourceLevel: 10, // Only trade if source has at least 10 units
      },
      totalResourcesTraded: gameState.tradeRoutes[routeId]?.totalResourcesTraded || 0,
      createdAt: Date.now()
    };

    gameState.tradeRoutes[routeId] = tradeRoute;
    
    if (automatic && !gameState.activeTradeRoutes.includes(routeId)) {
      gameState.activeTradeRoutes.push(routeId);
    }

    await this.saveGameState();
    return routeId;
  }

  /**
   * Click on current planet (core game mechanic)
   */
  async clickPlanet(clickEvent: { x: number; y: number; timestamp: number }): Promise<void> {
    const planetState = this.getCurrentPlanetState();
    const gameState = this.gameState$.value;
    if (!planetState || !gameState) return;

    // Calculate click value
    const clickValue = planetState.clickPower;
    
    // Add candy to current planet
    planetState.candy += clickValue;
    planetState.totalClicks++;
    
    // Update global metrics
    gameState.totalClicksAcrossAllPlanets++;
    
    // Update last interaction time
    planetState.lastActive = Date.now();
    gameState.lastUserInteraction = Date.now();

    // Process planet-specific click effects
    this.processPlanetSpecificClickEffects(planetState, clickValue);

    // TODO: Check for achievements
    // this.achievementService.checkClickAchievements(gameState);

    // Trigger save (throttled)
    await this.saveGameState();
  }

  /**
   * Initialize the service
   */
  private async initializeService(): Promise<void> {
    // Start the game loop
    this.startGameLoop();
    
    // Load existing game state
    await this.loadGameState();
  }

  /**
   * Main game loop - handles production, trading, and synergy calculations
   */
  private startGameLoop(): void {
    // High-frequency updates for active planet (60fps)
    interval(this.ACTIVE_UPDATE_INTERVAL)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const now = Date.now();
        if (now - this.activePlanetLastUpdate >= this.ACTIVE_UPDATE_INTERVAL) {
          this.updateActivePlanet(now);
          this.activePlanetLastUpdate = now;
        }
      });

    // Low-frequency updates for inactive planets (1fps) 
    interval(this.INACTIVE_UPDATE_INTERVAL)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const now = Date.now();
        if (now - this.inactivePlanetsLastUpdate >= this.INACTIVE_UPDATE_INTERVAL) {
          this.updateInactivePlanets(now);
          this.processTradeRoutes(now);
          this.updateNetworkSynergy(now);
          this.inactivePlanetsLastUpdate = now;
        }
      });
  }

  /**
   * Update the currently active planet (high frequency)
   */
  private updateActivePlanet(now: number): void {
    const gameState = this.gameState$.value;
    const currentPlanet = this.currentPlanet$.value;
    
    if (!gameState || !gameState.planets[currentPlanet]) return;

    const planet = gameState.planets[currentPlanet];
    const deltaTime = now - (planet.lastActive || now);
    
    if (deltaTime > 0) {
      // Update production
      const production = (planet.productionPerSecond * deltaTime) / 1000;
      planet.candy += production;
      
      // Update planet-specific mechanics
      this.updatePlanetSpecificMechanics(planet, deltaTime);
      
      // Update activity tracking
      planet.lastActive = now;
      planet.totalTimeActive += deltaTime;
    }
  }

  /**
   * Update inactive planets (low frequency for performance)
   */
  private updateInactivePlanets(now: number): void {
    const gameState = this.gameState$.value;
    const currentPlanet = this.currentPlanet$.value;
    
    if (!gameState) return;

    Object.values(gameState.planets).forEach(planet => {
      if (planet.id === currentPlanet || !planet.unlocked) return;
      
      const deltaTime = now - (planet.lastActive || now - 1000);
      
      if (deltaTime > 0) {
        // Reduced production for inactive planets (80% efficiency)
        const production = (planet.productionPerSecond * deltaTime * 0.8) / 1000;
        planet.candy += production;
        
        // Update planet-specific mechanics (reduced frequency)
        this.updatePlanetSpecificMechanics(planet, deltaTime);
        
        planet.lastActive = now;
      }
    });
  }

  /**
   * Process planet-specific mechanics (sweetness, pH, temperature, etc.)
   */
  private updatePlanetSpecificMechanics(planet: PlanetState, deltaTime: number): void {
    const mechanics = planet.specialMechanics;
    
    switch (planet.id) {
      case 'sweet':
        if (mechanics.sweetness) {
          mechanics.sweetness.level += (deltaTime / 1000) * (mechanics.sweetness.accumationRate || 1);
          if (mechanics.sweetness.level >= 100) {
            this.triggerSugarRush(planet);
          }
        }
        break;
        
      case 'sour':
        if (mechanics.phBalance) {
          // Natural acidification over time
          const phDrift = (deltaTime / 60000) * (mechanics.phBalance.naturalAcidification || 0.1);
          mechanics.phBalance.level = Math.max(3, mechanics.phBalance.level - phDrift);
          
          // Update production modifier based on pH
          const optimal = Math.abs(mechanics.phBalance.level - 5.5);
          mechanics.phBalance.productionModifier = Math.max(0.2, 1 - (optimal * 0.3));
        }
        break;
        
      case 'cold':
        if (mechanics.temperature) {
          // Natural temperature drift toward -10°C
          const drift = (deltaTime / 60000) * 0.5;
          if (mechanics.temperature.level > -10) {
            mechanics.temperature.level = Math.max(-10, mechanics.temperature.level - drift);
          } else if (mechanics.temperature.level < -10) {
            mechanics.temperature.level = Math.min(-10, mechanics.temperature.level + drift);
          }
        }
        break;
        
      case 'spicy':
        if (mechanics.heat) {
          // Heat buildup during production
          if (planet.productionPerSecond > 0) {
            mechanics.heat.level += (deltaTime / 1000) * (mechanics.heat.buildup || 0.5);
            if (mechanics.heat.level >= 100) {
              this.triggerOverheat(planet);
            }
          }
        }
        break;
        
      // Add cases for bitter and fizzy planets as they're implemented
    }
  }

  /**
   * Process automatic trade routes
   */
  private processTradeRoutes(now: number): void {
    const gameState = this.gameState$.value;
    if (!gameState) return;

    gameState.activeTradeRoutes.forEach(routeId => {
      const route = gameState.tradeRoutes[routeId];
      if (!route || !route.automatic) return;

      const fromPlanet = gameState.planets[route.fromPlanet];
      const toPlanet = gameState.planets[route.toPlanet];
      
      if (!fromPlanet.unlocked || !toPlanet.unlocked) return;

      // Check conditions
      const fromResource = fromPlanet.resources.exports[route.resourceType] || 0;
      if (fromResource < (route.conditions.minResourceLevel || 0)) return;

      // Execute trade
      const tradeAmount = (route.rate / 1000) * 1000; // 1 second worth
      const actualAmount = Math.min(tradeAmount, fromResource);
      const receivedAmount = actualAmount * route.efficiency;

      fromPlanet.resources.exports[route.resourceType] -= actualAmount;
      toPlanet.resources.imports[route.resourceType] = (toPlanet.resources.imports[route.resourceType] || 0) + receivedAmount;

      // Update statistics
      route.totalResourcesTraded += actualAmount;
      route.lastTradeTime = now;
    });
  }

  /**
   * Calculate and update network synergy bonuses
   */
  private updateNetworkSynergy(now: number): void {
    const gameState = this.gameState$.value;
    if (!gameState) return;

    const timeDelta = now - this.lastSynergyCalculation;
    this.lastSynergyCalculation = now;

    // Count active planets
    const activePlanets = Object.values(gameState.planets)
      .filter(p => p.unlocked && p.productionPerSecond > 0)
      .map(p => p.id);

    const planetCount = activePlanets.length;
    
    // Base synergy calculation
    let baseSynergy = 1.0;
    if (planetCount >= 2) baseSynergy = 1.10;
    if (planetCount >= 3) baseSynergy = 1.20;
    if (planetCount >= 4) baseSynergy = 1.35;
    if (planetCount >= 5) baseSynergy = 1.55;
    if (planetCount >= 6) baseSynergy = 1.80;

    // Update network synergy state
    gameState.networkSynergy.activePlanets = activePlanets;
    gameState.networkSynergy.synergyLevel = baseSynergy;
    
    // Apply bonuses
    gameState.networkSynergy.bonuses.productionMultiplier = baseSynergy;
    gameState.networkSynergy.bonuses.clickPowerMultiplier = Math.pow(baseSynergy, 0.5);

    // Track network uptime
    if (planetCount >= 2) {
      gameState.networkSynergy.totalNetworkTime += timeDelta;
      this.networkSynergyTimer += timeDelta;
    }

    gameState.networkSynergy.maxSimultaneousPlanets = Math.max(
      gameState.networkSynergy.maxSimultaneousPlanets,
      planetCount
    );
  }

  /**
   * Trigger Sweet Planet sugar rush event
   */
  private triggerSugarRush(planet: PlanetState): void {
    const sweetness = planet.specialMechanics.sweetness;
    if (!sweetness) return;

    sweetness.sugarRushActive = true;
    sweetness.sugarRushEndTime = Date.now() + 30000; // 30 seconds
    sweetness.level = 0; // Reset sweetness level
    sweetness.totalSugarRushes++;

    // Apply production multiplier
    planet.productionPerSecond *= 2;
    
    // Schedule rush end
    setTimeout(() => {
      if (sweetness.sugarRushActive) {
        sweetness.sugarRushActive = false;
        planet.productionPerSecond /= 2; // Remove multiplier
      }
    }, 30000);
  }

  /**
   * Trigger Spicy Planet overheat event
   */
  private triggerOverheat(planet: PlanetState): void {
    const heat = planet.specialMechanics.heat;
    if (!heat) return;

    // Apply penalties
    planet.candy *= 0.5; // Lose 50% candy
    heat.level = 0; // Reset heat
    heat.overheatCooldown = Date.now() + 60000; // 1 minute cooldown
    heat.totalOverheats++;

    // Temporarily disable production
    const originalProduction = planet.productionPerSecond;
    planet.productionPerSecond = 0;

    setTimeout(() => {
      planet.productionPerSecond = originalProduction;
      heat.overheatCooldown = undefined;
    }, 60000);
  }

  /**
   * Process planet-specific click effects
   */
  private processPlanetSpecificClickEffects(planet: PlanetState, clickValue: number): void {
    // Add planet-specific click bonuses or mechanics here
    // For example: Sweet planet click might add sweetness accumulation
    if (planet.id === 'sweet' && planet.specialMechanics.sweetness) {
      planet.specialMechanics.sweetness.level += clickValue * 0.01; // Small sweetness boost per click
    }
  }

  /**
   * Apply cross-planet recipe results
   */
  private applyRecipeResult(recipe: CrossPlanetRecipe, gameState: EnhancedGameState): void {
    // Implementation depends on recipe result type
    switch (recipe.result.type) {
      case 'multiplier':
        // Apply temporary production bonus
        // Implementation would track temporary effects
        break;
      case 'permanent_bonus':
        // Apply permanent improvements
        break;
      case 'special_ability':
        // Unlock new capabilities
        break;
    }
  }

  /**
   * Update playtime tracking for planet switching
   */
  private updatePlanetPlaytime(planetId: PlanetType): void {
    const gameState = this.gameState$.value;
    if (!gameState) return;

    const sessionTime = gameState.activePlanetSessionTime[planetId] || 0;
    const totalTime = gameState.metrics.playtimePerPlanet[planetId] || 0;
    
    gameState.metrics.playtimePerPlanet[planetId] = totalTime + sessionTime;
    gameState.activePlanetSessionTime[planetId] = 0; // Reset session timer
  }

  /**
   * Load game state from API
   */
  private async loadGameState(): Promise<void> {
    try {
      const savedState = await this.gameApi.loadGameState();
      
      if (!savedState) {
        // No saved state - initialize fresh
        this.initializeDefaultState();
        return;
      }
      
      if (isEnhancedGameState(savedState)) {
        // Already multi-planet
        this.gameState$.next(savedState);
        this.currentPlanet$.next(savedState.currentPlanet);
      } else {
        // Single-planet state - needs migration
        const migratedState = await this.migrateSinglePlanetState(savedState);
        this.gameState$.next(migratedState);
        this.currentPlanet$.next('sweet');
      }
    } catch (error) {
      console.error('Failed to load game state:', error);
      // Initialize default multi-planet state
      this.initializeDefaultState();
    }
  }

  /**
   * Save current game state to API
   */
  private async saveGameState(): Promise<void> {
    const gameState = this.gameState$.value;
    if (!gameState) return;

    try {
      await this.gameApi.saveGameState(gameState);
    } catch (error) {
      console.error('Failed to save game state:', error);
    }
  }

  /**
   * Migrate single-planet GameState to EnhancedGameState
   */
  private async migrateSinglePlanetState(oldState: GameState): Promise<EnhancedGameState> {
    this.updateMigrationStatus('transform', 25);

    // Create default planet states
    const planets: { [key in PlanetType]: PlanetState } = {
      sweet: this.createSweetPlanetFromOldState(oldState),
      sour: this.createDefaultPlanetState('sour'),
      cold: this.createDefaultPlanetState('cold'),
      spicy: this.createDefaultPlanetState('spicy'),
      bitter: this.createDefaultPlanetState('bitter'),
      fizzy: this.createDefaultPlanetState('fizzy')
    };

    this.updateMigrationStatus('validate', 75);

    const enhancedState: EnhancedGameState = {
      // Legacy single-planet fields (maintained for backward compatibility)
      candy: oldState.candy,
      totalCandyEarned: oldState.totalCandyEarned,
      clickPower: oldState.clickPower,
      productionPerSecond: oldState.productionPerSecond,
      upgrades: oldState.upgrades,
      unlockedUpgrades: oldState.unlockedUpgrades,
      totalClicks: oldState.totalClicks,
      totalFlyingCandiesCaught: oldState.totalFlyingCandiesCaught,
      
      // Preserve original session data
      sessionId: oldState.sessionId,
      lastSaved: oldState.lastSaved,
      startTime: oldState.startTime,
      totalPlayTime: oldState.totalPlayTime,

      // Preserve prestige system
      prestigeLevel: oldState.prestigeLevel,
      prestigePoints: oldState.prestigePoints,
      prestigeMultiplier: oldState.prestigeMultiplier,
      totalPrestigePoints: oldState.totalPrestigePoints,
      cosmicPrestigeLevel: 0,
      
      // Achievement & Collection System
      achievements: oldState.achievements,
      unlockedAchievements: oldState.unlockedAchievements,
      collectedCandies: oldState.collectedCandies,
      discoveredCandies: oldState.discoveredCandies,

      // Multi-planet core
      planets,
      currentPlanet: 'sweet',
      lastPlanetSwitch: Date.now(),

      // Initialize new systems
      solarSystemLevel: Math.floor(oldState.prestigeLevel / 2) + 1,
      totalCandyAcrossAllPlanets: oldState.totalCandyEarned,
      totalClicksAcrossAllPlanets: oldState.totalClicks,

      crossPlanetRecipes: {},
      discoveredRecipes: [],
      completedRecipes: [],

      tradeRoutes: {},
      activeTradeRoutes: [],

      networkSynergy: this.createDefaultNetworkSynergy(),
      planetUnlockProgress: this.createDefaultUnlockProgress(),

      cosmicAchievements: {},
      unlockedCosmicAchievements: [],

      // Session validation
      sessionStartTime: oldState.sessionStartTime,
      sessionStartCandyAmount: oldState.sessionStartCandyAmount,
      lastUserInteraction: oldState.lastUserInteraction,
      activePlanetSessionTime: { sweet: 0, sour: 0, cold: 0, spicy: 0, bitter: 0, fizzy: 0 },

      preferences: {
        autoSwitchPlanets: false,
        showNetworkSynergy: true,
        enableCelebrationCascades: true,
        preferredNavigationMode: 'auto',
        autoCollectAll: false,
        smartAlerts: true
      },

      metrics: {
        planetsUnlocked: 1,
        recipesDiscovered: 0,
        recipesCompleted: 0,
        tradeRoutesActive: 0,
        averageNetworkSynergyLevel: 1.0,
        totalPlanetSwitches: 0,
        favoritePlanet: 'sweet',
        playtimePerPlanet: { sweet: oldState.totalPlayTime, sour: 0, cold: 0, spicy: 0, bitter: 0, fizzy: 0 }
      }
    };

    this.updateMigrationStatus('complete', 100);
    return enhancedState;
  }

  // Helper methods for creating default states would continue here...
  // (Additional implementation details for brevity)

  private createSweetPlanetFromOldState(oldState: GameState): PlanetState {
    return {
      id: 'sweet',
      unlocked: true,
      unlockedAt: oldState.startTime,
      candy: oldState.candy,
      clickPower: oldState.clickPower,
      productionPerSecond: oldState.productionPerSecond,
      upgrades: oldState.upgrades,
      unlockedUpgrades: oldState.unlockedUpgrades,
      specialMechanics: {
        sweetness: {
          level: 0,
          accumationRate: 1,
          sugarRushActive: false,
          totalSugarRushes: 0
        }
      },
      resources: { exports: { sugar: 0, sweetness: 0, energy: 0 }, imports: {} },
      achievements: {},
      discoveredCandies: oldState.discoveredCandies,
      lastActive: Date.now(),
      totalTimeActive: oldState.totalPlayTime,
      totalClicks: oldState.totalClicks
    };
  }

  private createDefaultPlanetState(planetId: PlanetType): PlanetState {
    return {
      id: planetId,
      unlocked: false,
      candy: 0,
      clickPower: 1,
      productionPerSecond: 0,
      upgrades: {},
      unlockedUpgrades: [],
      specialMechanics: this.createDefaultPlanetMechanics(planetId),
      resources: { exports: {}, imports: {} },
      achievements: {},
      discoveredCandies: [],
      lastActive: Date.now(),
      totalTimeActive: 0,
      totalClicks: 0
    };
  }

  private createDefaultPlanetMechanics(planetId: PlanetType): any {
    // Return default mechanics based on planet type
    switch (planetId) {
      case 'sour': return { phBalance: { level: 7.0, naturalAcidification: 0.1, productionModifier: 0.8 } };
      case 'cold': return { temperature: { level: -10, crystallizationThreshold: -30, crystallizedCandy: 0 } };
      case 'spicy': return { heat: { level: 0, buildup: 0.5, totalOverheats: 0 } };
      case 'bitter': return { complexity: { level: 0, sophisticationMultiplier: 1.0, masterRecipesCompleted: 0 } };
      case 'fizzy': return { pressure: { level: 0, burstPotential: 1.0, totalBursts: 0 } };
      default: return {};
    }
  }

  private createDefaultNetworkSynergy(): NetworkSynergy {
    return {
      activePlanets: ['sweet'],
      synergyLevel: 1.0,
      bonuses: {
        productionMultiplier: 1.0,
        clickPowerMultiplier: 1.0,
        resourceGenerationBonus: 1.0,
        recipeEfficiencyBonus: 1.0
      },
      connections: {},
      totalNetworkTime: 0,
      maxSimultaneousPlanets: 1,
      networkUptime: 0
    };
  }

  private createDefaultUnlockProgress(): { [planetId: string]: PlanetUnlockProgress } {
    // Implementation for default unlock progress tracking
    return {};
  }

  private updateMigrationStatus(step: MigrationStatus['currentStep'], progress: number): void {
    this.migrationStatus$.next({
      inProgress: step !== 'complete' && step !== 'failed',
      currentStep: step,
      progress,
      backupCreated: true,
      canRollback: step !== 'complete'
    });
  }

  private initializeDefaultState(): void {
    // Create a completely new multi-planet game state
    const defaultState: EnhancedGameState = {
      // Legacy single-planet fields (synced with sweet planet)
      candy: 0,
      totalCandyEarned: 0,
      clickPower: 1,
      productionPerSecond: 0,
      upgrades: {},
      unlockedUpgrades: [],
      totalClicks: 0,
      totalFlyingCandiesCaught: 0,
      
      // Core session data
      sessionId: Math.random().toString(36),
      lastSaved: Date.now(),
      startTime: Date.now(),
      totalPlayTime: 0,
      
      // Prestige system
      prestigeLevel: 0,
      prestigePoints: 0,
      prestigeMultiplier: 1,
      totalPrestigePoints: 0,
      cosmicPrestigeLevel: 0,
      
      // Achievement & Collection System
      achievements: {},
      unlockedAchievements: [],
      collectedCandies: {},
      discoveredCandies: [],
      planets: {
        sweet: this.createDefaultPlanetState('sweet'),
        sour: this.createDefaultPlanetState('sour'),
        cold: this.createDefaultPlanetState('cold'),
        spicy: this.createDefaultPlanetState('spicy'),
        bitter: this.createDefaultPlanetState('bitter'),
        fizzy: this.createDefaultPlanetState('fizzy')
      },
      currentPlanet: 'sweet',
      lastPlanetSwitch: Date.now(),
      solarSystemLevel: 1,
      totalCandyAcrossAllPlanets: 0,
      totalClicksAcrossAllPlanets: 0,
      crossPlanetRecipes: {},
      discoveredRecipes: [],
      completedRecipes: [],
      tradeRoutes: {},
      activeTradeRoutes: [],
      networkSynergy: this.createDefaultNetworkSynergy(),
      planetUnlockProgress: this.createDefaultUnlockProgress(),
      cosmicAchievements: {},
      unlockedCosmicAchievements: [],
      activePlanetSessionTime: { sweet: 0, sour: 0, cold: 0, spicy: 0, bitter: 0, fizzy: 0 },
      preferences: {
        autoSwitchPlanets: false,
        showNetworkSynergy: true,
        enableCelebrationCascades: true,
        preferredNavigationMode: 'auto',
        autoCollectAll: false,
        smartAlerts: true
      },
      metrics: {
        planetsUnlocked: 1,
        recipesDiscovered: 0,
        recipesCompleted: 0,
        tradeRoutesActive: 0,
        averageNetworkSynergyLevel: 1.0,
        totalPlanetSwitches: 0,
        favoritePlanet: 'sweet',
        playtimePerPlanet: { sweet: 0, sour: 0, cold: 0, spicy: 0, bitter: 0, fizzy: 0 }
      }
    };

    // Sweet planet starts unlocked with basic state
    defaultState.planets.sweet.unlocked = true;
    defaultState.planets.sweet.clickPower = 1;

    this.gameState$.next(defaultState);
    this.currentPlanet$.next('sweet');
  }

  /**
   * Collect candy from all unlocked planets
   */
  async collectAllCandy(): Promise<number> {
    const gameState = this.gameState$.value;
    if (!gameState) return 0;

    let totalCollected = 0;
    
    Object.values(gameState.planets).forEach(planet => {
      if (planet.unlocked && planet.candy > 0) {
        totalCollected += planet.candy;
        planet.candy = 0;
      }
    });

    if (totalCollected > 0) {
      // Update total candy in legacy fields for compatibility
      gameState.totalCandyEarned += totalCollected;
      gameState.candy = gameState.planets[gameState.currentPlanet].candy;
      
      await this.saveGameState();
    }

    return totalCollected;
  }

  /**
   * Toggle auto-pilot mode (auto planet switching)
   */
  async toggleAutoPilot(): Promise<boolean> {
    const gameState = this.gameState$.value;
    if (!gameState) return false;

    gameState.preferences.autoSwitchPlanets = !gameState.preferences.autoSwitchPlanets;
    await this.saveGameState();
    
    return gameState.preferences.autoSwitchPlanets;
  }

  /**
   * Enable/disable auto-collect for all planets
   */
  async toggleAutoCollectAll(): Promise<boolean> {
    const gameState = this.gameState$.value;
    if (!gameState) return false;

    gameState.preferences.autoCollectAll = !gameState.preferences.autoCollectAll;
    await this.saveGameState();
    
    return gameState.preferences.autoCollectAll;
  }

  /**
   * Calculate unlock progress for a specific planet
   */
  calculatePlanetUnlockProgress(planetId: PlanetType): number {
    const gameState = this.gameState$.value;
    if (!gameState || gameState.planets[planetId].unlocked) return 100;

    switch (planetId) {
      case 'sour':
        const totalCandyAcrossAll = Object.values(gameState.planets)
          .reduce((sum, planet) => sum + planet.candy, 0);
        return Math.min(100, (totalCandyAcrossAll / 10000) * 100);
        
      case 'cold':
        return Math.min(100, (gameState.prestigeLevel / 1) * 100);
        
      case 'spicy':
        const totalCandiesSpicy = gameState.totalCandyAcrossAllPlanets || Object.values(gameState.planets)
          .reduce((sum, planet) => sum + planet.candy, 0);
        return Math.min(100, (totalCandiesSpicy / 100000) * 100);
        
      case 'bitter':
        // Based on archaeological discoveries/special achievements
        const completedRecipes = gameState.completedRecipes.length;
        return Math.min(100, (completedRecipes / 5) * 100);
        
      case 'fizzy':
        const totalCandiesFizzy = gameState.totalCandyAcrossAllPlanets || Object.values(gameState.planets)
          .reduce((sum, planet) => sum + planet.candy, 0);
        return Math.min(100, (totalCandiesFizzy / 1000000) * 100);
        
      default:
        return 0;
    }
  }

  /**
   * Get planet-specific status for display
   */
  getPlanetSpecificStatus(planetId: PlanetType): { status: string; specialAlert?: string } {
    const gameState = this.gameState$.value;
    if (!gameState) return { status: 'Loading...' };

    const planet = gameState.planets[planetId];
    if (!planet.unlocked) {
      const progress = this.calculatePlanetUnlockProgress(planetId);
      return { 
        status: this.getUnlockRequirementText(planetId),
        specialAlert: progress > 80 ? 'Almost unlocked!' : undefined
      };
    }

    // Return planet-specific status based on mechanics
    switch (planetId) {
      case 'sweet':
        const sweetness = planet.specialMechanics.sweetness;
        if (sweetness?.sugarRushActive) {
          return { status: '🍯 Sugar Rush Active! (2x Production)' };
        }
        return { status: `🍯 Sweetness: ${sweetness?.level?.toFixed(0) || 0}/100` };
        
      case 'sour':
        const phBalance = planet.specialMechanics.phBalance;
        const ph = phBalance?.level || 7.0;
        return { 
          status: `🧪 pH Level: ${ph.toFixed(1)}`,
          specialAlert: (ph < 4 || ph > 6.5) ? 'pH needs adjustment!' : undefined
        };
        
      case 'cold':
        const temperature = planet.specialMechanics.temperature;
        return { status: `❄️ Temperature: ${temperature?.level?.toFixed(0) || -10}°C` };
        
      case 'spicy':
        const heat = planet.specialMechanics.heat;
        const heatLevel = heat?.level || 0;
        if (heat?.overheatCooldown && Date.now() < heat.overheatCooldown) {
          return { status: '🔥 COOLING DOWN - Production Halted' };
        }
        return { 
          status: `🔥 Heat Level: ${heatLevel.toFixed(0)}/100`,
          specialAlert: heatLevel > 85 ? 'Overheat risk!' : undefined
        };
        
      case 'bitter':
        const complexity = planet.specialMechanics.complexity;
        return { status: `🎭 Complexity: ${complexity?.level?.toFixed(0) || 0}` };
        
      case 'fizzy':
        const pressure = planet.specialMechanics.pressure;
        const pressureLevel = pressure?.level || 0;
        return { 
          status: `💨 Pressure: ${pressureLevel.toFixed(0)}/100`,
          specialAlert: pressureLevel > 80 ? 'Ready for pressure release!' : undefined
        };
        
      default:
        return { status: 'Status unknown' };
    }
  }

  /**
   * Get unlock requirement text for locked planets
   */
  private getUnlockRequirementText(planetId: PlanetType): string {
    switch (planetId) {
      case 'sour':
        return 'Reach 10,000 total candy across all planets';
      case 'cold':
        return 'Complete first prestige cycle';
      case 'spicy':
        return 'Achieve 100,000 total candies across all planets';
      case 'bitter':
        return 'Complete 5 cross-planet recipes';
      case 'fizzy':
        return 'Achieve 1,000,000 total candies across all planets';
      default:
        return 'Requirements unknown';
    }
  }
}