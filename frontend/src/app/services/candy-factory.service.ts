import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { 
  GameState, 
  CandyUpgrade, 
  UpgradePurchaseResult, 
  ProductionTick,
  ClickEvent,
  FloatingNumber,
  Particle,
  FlyingCandy,
  PrestigeData
} from '../models/candy-factory.interface';
import { CANDY_UPGRADES } from '../models/candy-upgrades.data';
import { AchievementService } from './achievement.service';
import { GameApiService } from './game-api.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CandyFactoryService {
  private readonly SAVE_KEY = 'cosmic-candy-factory-save';
  private readonly PRODUCTION_INTERVAL = 100; // Update every 100ms for smooth production
  private readonly AUTOSAVE_INTERVAL = 1000; // Autosave to localStorage every second
  private readonly SERVER_SAVE_INTERVAL = 30000; // Save to server every 30 seconds
  private readonly SERVER_SYNC_INTERVAL = 30000; // Sync with server every 30 seconds
  
  // Synchronization locks to prevent race conditions
  private isServerSyncInProgress = false;
  private isLoadingFromServer = false;
  private serverOperationQueue: Array<() => Promise<void>> = [];
  private lastManualSyncTime = 0;
  private readonly MANUAL_SYNC_THROTTLE = 5000; // Throttle manual sync to every 5 seconds
  private readonly FLYING_CANDY_INTERVAL = 8000; // Spawn flying candy every 8 seconds
  private readonly FLYING_CANDY_LIFETIME = 12000; // Flying candy lasts 12 seconds

  private gameState: GameState;
  private gameStateSubject = new BehaviorSubject<GameState>(this.getInitialGameState());
  private productionSubscription?: Subscription;
  private autosaveSubscription?: Subscription;
  private serverSaveSubscription?: Subscription;
  private serverSyncSubscription?: Subscription;
  private flyingCandySubscription?: Subscription;
  private flyingCandyAnimationSubscription?: Subscription;

  // Observables for UI
  public gameState$ = this.gameStateSubject.asObservable();
  
  // Public getter for current state
  public get currentGameState(): GameState {
    return this.gameState;
  }
  private floatingNumbersSubject = new BehaviorSubject<FloatingNumber[]>([]);
  public floatingNumbers$ = this.floatingNumbersSubject.asObservable();
  private particlesSubject = new BehaviorSubject<Particle[]>([]);
  public particles$ = this.particlesSubject.asObservable();
  private flyingCandiesSubject = new BehaviorSubject<FlyingCandy[]>([]);
  public flyingCandies$ = this.flyingCandiesSubject.asObservable();

  constructor(
    private achievementService: AchievementService,
    private gameApiService: GameApiService,
    private authService: AuthService
  ) {
    // Start with initial state, will be replaced by initialization
    this.gameState = this.getInitialGameState();
    this.gameStateSubject.next(this.gameState);
    
    // Critical: Initialize game with server-first approach
    this.initializeGame().then(() => {
      // Start all systems AFTER game initialization is complete
      this.startProductionLoop();
      this.startAutosave();
      this.startServerSave();
      this.startServerSync();
      this.startFlyingCandySystem();
      this.updateUnlockedUpgrades();
      this.achievementService.updateAchievements(this.gameState);
    });
  }

  private getInitialGameState(): GameState {
    return {
      candy: 0,
      totalCandyEarned: 0,
      clickPower: 1,
      productionPerSecond: 0,
      upgrades: {},
      unlockedUpgrades: [],
      sessionId: this.generateSessionId(),
      lastSaved: Date.now(),
      startTime: Date.now(),
      prestigeLevel: 0,
      prestigePoints: 0,
      prestigeMultiplier: 1,
      totalPrestigePoints: 0,
      
      // Achievement & Collection System
      achievements: {},
      unlockedAchievements: [],
      collectedCandies: {},
      discoveredCandies: [],
      totalClicks: 0,
      totalFlyingCandiesCaught: 0,
      totalPlayTime: 0
    };
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Critical: Initialize game with server-first approach
   * This fixes the core sync issue where Browser B shows 0 candy instead of Browser A's progress
   */
  private async initializeGame(): Promise<void> {
    // 🚨 ALWAYS load from server first - this fixes the core problem
    if (this.authService.isAuthenticated()) {
      try {
        const serverData = await this.gameApiService.loadGameState();
        
        if (serverData) {
          // Use server data as authoritative starting point
          this.gameState = {
            ...serverData,
            // Add session validation fields
            sessionStartTime: Date.now(),
            sessionStartCandyAmount: serverData.candy,
            lastUserInteraction: Date.now()
          };
          
          this.recalculateStatsForLoadedState(this.gameState);
          this.gameStateSubject.next(this.gameState);
          
          console.log('✅ Loaded latest data from server:', serverData.candy, 'candy');
          return; // Server data loaded successfully
        }
      } catch (error) {
        console.warn('Failed to load from server, using local fallback:', error);
      }
    }
    
    // Fallback: localStorage or fresh state (only if server unavailable)
    const localData = this.loadGameStateFromLocalStorage();
    if (localData) {
      this.gameState = {
        ...localData,
        // Add session validation fields for local data too
        sessionStartTime: Date.now(),
        sessionStartCandyAmount: localData.candy,
        lastUserInteraction: Date.now()
      };
      this.recalculateStatsForLoadedState(this.gameState);
      console.log('Using local data as fallback:', localData.candy, 'candy');
    } else {
      // Fresh game state with session fields
      this.gameState = {
        ...this.getInitialGameState(),
        sessionStartTime: Date.now(),
        sessionStartCandyAmount: 0,
        lastUserInteraction: Date.now()
      };
      console.log('Starting fresh game state');
    }
    
    this.gameStateSubject.next(this.gameState);
  }

  /**
   * Separate localStorage loading method for clarity
   */
  private loadGameStateFromLocalStorage(): GameState | null {
    try {
      const saved = localStorage.getItem(this.SAVE_KEY);
      if (saved) {
        const state = JSON.parse(saved) as GameState;
        return state;
      }
    } catch (error) {
      console.error('Failed to load game state from localStorage:', error);
    }
    return null;
  }

  // Core clicking functionality
  clickPlanet(event: { clientX: number, clientY: number }): void {
    // Track user interaction for session validation
    this.gameState.lastUserInteraction = Date.now();
    
    // Apply achievement bonuses
    const bonuses = this.achievementService.calculatePassiveBonuses(this.gameState);
    const baseCandyEarned = this.gameState.clickPower;
    const candyEarned = Math.floor(baseCandyEarned * bonuses.clickMultiplier);
    
    this.gameState.candy += candyEarned;
    this.gameState.totalCandyEarned += candyEarned;
    this.gameState.totalClicks++;

    // Track click for achievements
    this.achievementService.trackClick();

    // Create floating number
    this.addFloatingNumber({
      id: 'float_' + Date.now() + '_' + Math.random(),
      x: event.clientX,
      y: event.clientY,
      value: candyEarned,
      timestamp: Date.now(),
      color: this.getClickPowerColor(candyEarned)
    });

    // Create particles
    this.createClickParticles(event.clientX, event.clientY);

    this.updateUnlockedUpgrades();
    this.achievementService.updateAchievements(this.gameState);
    this.gameStateSubject.next(this.gameState);
  }

  private getClickPowerColor(power: number): string {
    if (power >= 10000) return '#ff4444'; // Red for massive damage
    if (power >= 1000) return '#ff8800'; // Orange for high damage
    if (power >= 100) return '#ffdd00'; // Yellow for medium damage
    if (power >= 10) return '#44ff44'; // Green for low damage
    return '#ffffff'; // White for basic damage
  }

  // Upgrade system
  purchaseUpgrade(upgradeId: string): UpgradePurchaseResult {
    // Track user interaction for session validation
    this.gameState.lastUserInteraction = Date.now();
    
    const upgrade = CANDY_UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) {
      return { success: false, errorMessage: 'Upgrade not found' };
    }

    const currentLevel = this.gameState.upgrades[upgradeId] || 0;
    const price = this.calculateUpgradePrice(upgrade, currentLevel);

    if (this.gameState.candy < price) {
      return { success: false, errorMessage: 'Not enough candy' };
    }

    // Purchase upgrade
    this.gameState.candy -= price;
    this.gameState.upgrades[upgradeId] = currentLevel + 1;

    // Update stats
    this.recalculateStats();
    this.updateUnlockedUpgrades();

    const newPrice = this.calculateUpgradePrice(upgrade, currentLevel + 1);
    this.gameStateSubject.next(this.gameState);

    return {
      success: true,
      newPrice,
      newLevel: currentLevel + 1
    };
  }

  calculateUpgradePrice(upgrade: CandyUpgrade, level: number): number {
    return Math.floor(upgrade.basePrice * Math.pow(1.15, level));
  }

  getUpgradeLevel(upgradeId: string): number {
    return this.gameState.upgrades[upgradeId] || 0;
  }

  isUpgradeUnlocked(upgradeId: string): boolean {
    return this.gameState.unlockedUpgrades.includes(upgradeId);
  }

  private updateUnlockedUpgrades(): void {
    // Ensure unlockedUpgrades array exists
    if (!this.gameState.unlockedUpgrades) {
      this.gameState.unlockedUpgrades = [];
    }

    for (const upgrade of CANDY_UPGRADES) {
      if (this.gameState.unlockedUpgrades.includes(upgrade.id)) {
        continue; // Already unlocked
      }

      let shouldUnlock = false;

      switch (upgrade.unlockRequirement.type) {
        case 'candy':
          shouldUnlock = this.gameState.totalCandyEarned >= (upgrade.unlockRequirement.value as number);
          break;
        case 'production':
          shouldUnlock = this.gameState.productionPerSecond >= (upgrade.unlockRequirement.value as number);
          break;
        case 'upgrade':
          const requiredUpgrade = upgrade.unlockRequirement.value as string;
          shouldUnlock = (this.gameState.upgrades[requiredUpgrade] || 0) > 0;
          break;
      }

      if (shouldUnlock) {
        this.gameState.unlockedUpgrades.push(upgrade.id);
      }
    }
  }

  private recalculateStats(): void {
    // Ensure prestige multiplier is valid
    if (!this.gameState.prestigeMultiplier || isNaN(this.gameState.prestigeMultiplier)) {
      this.gameState.prestigeMultiplier = 1;
    }

    // Calculate base click power
    let baseClickPower = 1;
    for (const upgrade of CANDY_UPGRADES.filter(u => u.type === 'click')) {
      const level = this.gameState.upgrades[upgrade.id] || 0;
      baseClickPower += level * upgrade.powerPerLevel;
    }
    // Apply prestige multiplier
    this.gameState.clickPower = Math.floor(baseClickPower * this.gameState.prestigeMultiplier);

    // Calculate base production per second
    let baseProduction = 0;
    for (const upgrade of CANDY_UPGRADES.filter(u => u.type === 'production')) {
      const level = this.gameState.upgrades[upgrade.id] || 0;
      baseProduction += level * (upgrade.productionPerSecond || 0);
    }
    // Apply prestige multiplier
    this.gameState.productionPerSecond = baseProduction * this.gameState.prestigeMultiplier;
  }

  // Production loop
  private startProductionLoop(): void {
    this.productionSubscription = interval(this.PRODUCTION_INTERVAL).subscribe(() => {
      // Update total play time
      this.gameState.totalPlayTime += this.PRODUCTION_INTERVAL;

      if (this.gameState.productionPerSecond > 0) {
        // Apply achievement bonuses to production
        const bonuses = this.achievementService.calculatePassiveBonuses(this.gameState);
        const effectiveProduction = this.gameState.productionPerSecond * bonuses.productionMultiplier;
        const candyToAdd = (effectiveProduction * this.PRODUCTION_INTERVAL) / 1000;
        
        this.gameState.candy += candyToAdd;
        this.gameState.totalCandyEarned += candyToAdd;
        
        // Periodically update achievements (every second to avoid performance issues)
        if (Date.now() % 1000 < this.PRODUCTION_INTERVAL) {
          this.achievementService.updateAchievements(this.gameState);
        }
        
        this.gameStateSubject.next(this.gameState);
      }
    });
  }

  // Auto-save functionality  
  private startAutosave(): void {
    this.autosaveSubscription = interval(this.AUTOSAVE_INTERVAL).subscribe(() => {
      this.saveGameState();
    });
  }

  // Server save functionality (separate from local autosave)
  private startServerSave(): void {
    this.serverSaveSubscription = interval(this.SERVER_SAVE_INTERVAL).subscribe(() => {
      this.saveToServer();
    });
  }

  private saveGameState(): void {
    this.gameState.lastSaved = Date.now();
    localStorage.setItem(this.SAVE_KEY, JSON.stringify(this.gameState));
    // Server saving now handled by separate interval
  }


  private recalculateStatsForLoadedState(state: GameState): void {
    // Ensure prestige fields exist (for backward compatibility)
    if (typeof state.prestigeLevel === 'undefined') state.prestigeLevel = 0;
    if (typeof state.prestigePoints === 'undefined') state.prestigePoints = 0;
    if (typeof state.prestigeMultiplier === 'undefined') state.prestigeMultiplier = 1;
    if (typeof state.totalPrestigePoints === 'undefined') state.totalPrestigePoints = 0;
    
    // Ensure achievement fields exist (for backward compatibility)
    if (typeof state.achievements === 'undefined') state.achievements = {};
    if (typeof state.unlockedAchievements === 'undefined') state.unlockedAchievements = [];
    if (typeof state.collectedCandies === 'undefined') state.collectedCandies = {};
    if (typeof state.discoveredCandies === 'undefined') state.discoveredCandies = [];
    if (typeof state.totalClicks === 'undefined') state.totalClicks = 0;
    if (typeof state.totalFlyingCandiesCaught === 'undefined') state.totalFlyingCandiesCaught = 0;
    if (typeof state.totalPlayTime === 'undefined') state.totalPlayTime = 0;
    
    // Ensure session validation fields exist (for backward compatibility)
    if (typeof state.sessionStartTime === 'undefined') state.sessionStartTime = Date.now();
    if (typeof state.sessionStartCandyAmount === 'undefined') state.sessionStartCandyAmount = state.candy;
    if (typeof state.lastUserInteraction === 'undefined') state.lastUserInteraction = Date.now();
    
    // Recalculate derived stats after loading
    const tempState = this.gameState;
    this.gameState = state;
    this.recalculateStats();
    if (!tempState) {
      this.gameState = state;
    }
  }

  // Server synchronization methods

  /**
   * Update game state with server data - used by migration service
   * Uses synchronization to prevent race conditions
   */
  public updateGameStateFromServer(serverData: GameState): void {
    console.log('Updating game state from server data via migration:', serverData);
    
    // Cancel any pending server operations to avoid conflicts
    this.serverOperationQueue = [];
    this.isServerSyncInProgress = false;
    this.isLoadingFromServer = true;
    
    try {
      this.gameState = serverData;
      this.recalculateStatsForLoadedState(this.gameState);
      this.gameStateSubject.next(this.gameState);
      this.updateUnlockedUpgrades();
      this.achievementService.updateAchievements(this.gameState);
      this.saveGameState(); // Save to localStorage to maintain consistency
      
      console.log('Successfully updated game state from server via migration');
    } finally {
      this.isLoadingFromServer = false;
    }
  }

  /**
   * Execute server operations sequentially to prevent race conditions
   */
  private async executeServerOperation<T>(operation: () => Promise<T>): Promise<T | null> {
    return new Promise((resolve) => {
      const wrappedOperation = async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          console.error('Server operation failed:', error);
          resolve(null);
        }
      };
      
      this.serverOperationQueue.push(wrappedOperation);
      this.processServerOperationQueue();
    });
  }

  /**
   * Process queued server operations one at a time
   */
  private async processServerOperationQueue(): Promise<void> {
    if (this.isServerSyncInProgress || this.isLoadingFromServer || this.serverOperationQueue.length === 0) {
      return;
    }

    this.isServerSyncInProgress = true;
    
    while (this.serverOperationQueue.length > 0 && !this.isLoadingFromServer) {
      const operation = this.serverOperationQueue.shift();
      if (operation) {
        await operation();
      }
    }
    
    this.isServerSyncInProgress = false;
  }

  private startServerSync(): void {
    this.serverSyncSubscription = interval(this.SERVER_SYNC_INTERVAL).subscribe(() => {
      this.syncWithServer();
    });
  }

  private async syncWithServer(): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    // Use server operation queue to prevent race conditions
    await this.executeServerOperation(async () => {
      console.log('Syncing game state with server');
      const syncResult = await this.gameApiService.syncGameState(this.gameState);
      if (syncResult) {
        if (syncResult.conflictResolved) {
          console.log('Game state conflict resolved:', syncResult.message);
          this.gameState = syncResult.gameData;
          this.recalculateStatsForLoadedState(this.gameState);
          this.gameStateSubject.next(this.gameState);
          this.updateUnlockedUpgrades();
          this.achievementService.updateAchievements(this.gameState);
        } else {
          console.log('Game synchronized successfully');
        }
      }
    });
  }

  private async saveToServer(): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    // CRITICAL: Only save if user has interacted recently
    // This prevents idle browsers from overwriting active browser data
    const IDLE_THRESHOLD = 60000; // 1 minute of inactivity
    const timeSinceInteraction = Date.now() - (this.gameState.lastUserInteraction || 0);
    
    if (timeSinceInteraction > IDLE_THRESHOLD) {
      console.log('Skipping server save - browser is idle (no interaction for', Math.floor(timeSinceInteraction / 1000), 'seconds)');
      return;
    }

    // Use server operation queue to prevent race conditions
    await this.executeServerOperation(async () => {
      console.log('Saving game state to server (user active)');
      await this.gameApiService.saveGameState(this.gameState);
    });
  }

  // Public method to manually sync with server
  public async manualSync(): Promise<boolean> {
    if (!this.authService.isAuthenticated()) {
      console.warn('Cannot sync: user not authenticated');
      return false;
    }

    // Throttle manual sync to prevent spam
    const now = Date.now();
    if (now - this.lastManualSyncTime < this.MANUAL_SYNC_THROTTLE) {
      console.warn('Manual sync throttled - please wait');
      return false;
    }

    this.lastManualSyncTime = now;

    try {
      // Phase 1 approach: Manual sync just loads latest server data
      // This replaces the old sync logic with simple "get latest data"
      await this.executeServerOperation(async () => {
        console.log('Manual sync: Loading latest data from server');
        const serverData = await this.gameApiService.loadGameState();
        
        if (serverData) {
          console.log('Manual sync: Loaded server data with', serverData.candy, 'candy');
          this.gameState = {
            ...serverData,
            // Update session validation fields for the newly loaded data
            sessionStartTime: Date.now(),
            sessionStartCandyAmount: serverData.candy,
            lastUserInteraction: Date.now()
          };
          
          this.recalculateStatsForLoadedState(this.gameState);
          this.gameStateSubject.next(this.gameState);
          this.updateUnlockedUpgrades();
          this.achievementService.updateAchievements(this.gameState);
        }
      });
      
      return true;
    } catch (error) {
      console.error('Manual sync failed:', error);
      return false;
    }
  }

  // Visual effects
  private addFloatingNumber(floatingNumber: FloatingNumber): void {
    const current = this.floatingNumbersSubject.value;
    this.floatingNumbersSubject.next([...current, floatingNumber]);

    // Remove after animation
    setTimeout(() => {
      const updated = this.floatingNumbersSubject.value.filter(fn => fn.id !== floatingNumber.id);
      this.floatingNumbersSubject.next(updated);
    }, 2000);
  }

  private createClickParticles(x: number, y: number): void {
    const particleCount = Math.min(10, Math.max(3, Math.floor(this.gameState.clickPower / 10)));
    const newParticles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const particle: Particle = {
        id: 'particle_' + Date.now() + '_' + i,
        x,
        y,
        velocityX: (Math.random() - 0.5) * 200,
        velocityY: (Math.random() - 0.5) * 200 - 50,
        size: Math.random() * 6 + 2,
        color: `hsl(${Math.random() * 60 + 180}, 70%, 60%)`, // Blue-cyan range
        life: 1,
        maxLife: 1
      };
      newParticles.push(particle);
    }

    const current = this.particlesSubject.value;
    this.particlesSubject.next([...current, ...newParticles]);

    // Remove particles after animation
    setTimeout(() => {
      const updated = this.particlesSubject.value.filter(p => 
        !newParticles.some(np => np.id === p.id)
      );
      this.particlesSubject.next(updated);
    }, 1000);
  }

  // Flying Candy System
  private startFlyingCandySystem(): void {
    // Spawn flying candies periodically with more random variation
    this.flyingCandySubscription = interval(this.FLYING_CANDY_INTERVAL + Math.random() * 4000).subscribe(() => {
      if (this.gameState.totalCandyEarned > 10) { // Spawn earlier for testing
        this.spawnFlyingCandy();
      }
    });

    // Animate flying candies slower for better interaction
    this.flyingCandyAnimationSubscription = interval(120).subscribe(() => { // Slower animation for easier clicking
      this.updateFlyingCandies();
    });
  }

  private spawnFlyingCandy(): void {
    const progressMultiplier = Math.log10(this.gameState.totalCandyEarned + 1) / 10;
    const baseValue = Math.max(1, Math.floor(this.gameState.clickPower * 5 * (1 + progressMultiplier)));
    
    // Rare chance for golden candy with higher value
    const isGolden = Math.random() < 0.1;
    const value = isGolden ? baseValue * 10 : baseValue;
    const color = isGolden ? '#ffd700' : '#ff69b4';
    
    const startSide = Math.random() < 0.5 ? 'left' : 'right';
    const startX = startSide === 'left' ? -50 : window.innerWidth + 50;
    const startY = Math.random() * (window.innerHeight * 0.7) + 100;
    
    const targetX = startSide === 'left' ? window.innerWidth + 50 : -50;
    const targetY = Math.random() * (window.innerHeight * 0.7) + 100;
    
    const distance = Math.abs(targetX - startX);
    const duration = 15000 + Math.random() * 10000; // 15-25 seconds to cross screen (much slower)
    const velocityX = (targetX - startX) / (duration / 120); // Slower movement due to 120ms intervals
    const velocityY = (targetY - startY) / (duration / 120);

    const flyingCandy: FlyingCandy = {
      id: 'flying_' + Date.now() + '_' + Math.random(),
      x: startX,
      y: startY,
      velocityX,
      velocityY,
      size: isGolden ? 80 : 70, // Larger size for easier clicking
      value,
      color,
      life: 1,
      maxLife: 1,
      startTime: Date.now()
    };

    const current = this.flyingCandiesSubject.value;
    this.flyingCandiesSubject.next([...current, flyingCandy]);

    // Remove after lifetime
    setTimeout(() => {
      const updated = this.flyingCandiesSubject.value.filter(fc => fc.id !== flyingCandy.id);
      this.flyingCandiesSubject.next(updated);
    }, this.FLYING_CANDY_LIFETIME);
  }

  private updateFlyingCandies(): void {
    const current = this.flyingCandiesSubject.value;
    const updated = current.map(candy => ({
      ...candy,
      x: candy.x + candy.velocityX,
      y: candy.y + candy.velocityY,
      life: Math.max(0, 1 - (Date.now() - candy.startTime) / this.FLYING_CANDY_LIFETIME)
    }));
    
    this.flyingCandiesSubject.next(updated);
  }

  clickFlyingCandy(candyId: string): void {
    // Track user interaction for session validation
    this.gameState.lastUserInteraction = Date.now();
    
    const current = this.flyingCandiesSubject.value;
    const candy = current.find(c => c.id === candyId);
    
    if (candy) {
      const isGolden = candy.color === '#ffd700';
      
      // Apply prestige and achievement multipliers
      const bonuses = this.achievementService.calculatePassiveBonuses(this.gameState);
      const bonusValue = Math.floor(candy.value * this.gameState.prestigeMultiplier * bonuses.clickMultiplier);
      
      this.gameState.candy += bonusValue;
      this.gameState.totalCandyEarned += bonusValue;
      this.gameState.totalFlyingCandiesCaught++;

      // Track flying candy catch for achievements
      this.achievementService.trackFlyingCandyCatch(isGolden);

      // Discover basic candy or special candy based on type
      if (isGolden) {
        this.achievementService.discoverCandy('golden_star', this.gameState);
      } else {
        this.achievementService.discoverCandy('basic_candy', this.gameState);
      }

      // Create special floating number for flying candy bonus
      this.addFloatingNumber({
        id: 'flying_bonus_' + Date.now(),
        x: candy.x,
        y: candy.y,
        value: bonusValue,
        timestamp: Date.now(),
        color: candy.color === '#ffd700' ? '#ffff00' : '#ff1493'
      });

      // Create burst of particles
      this.createFlyingCandyParticles(candy.x, candy.y, candy.color);

      // Remove the clicked candy
      const updated = current.filter(c => c.id !== candyId);
      this.flyingCandiesSubject.next(updated);

      this.achievementService.updateAchievements(this.gameState);
      this.gameStateSubject.next(this.gameState);
    }
  }

  private createFlyingCandyParticles(x: number, y: number, baseColor: string): void {
    const particleCount = 15;
    const newParticles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const particle: Particle = {
        id: 'bonus_particle_' + Date.now() + '_' + i,
        x,
        y,
        velocityX: (Math.random() - 0.5) * 300,
        velocityY: (Math.random() - 0.5) * 300 - 100,
        size: Math.random() * 8 + 4,
        color: baseColor,
        life: 1,
        maxLife: 1
      };
      newParticles.push(particle);
    }

    const current = this.particlesSubject.value;
    this.particlesSubject.next([...current, ...newParticles]);

    setTimeout(() => {
      const updated = this.particlesSubject.value.filter(p => 
        !newParticles.some(np => np.id === p.id)
      );
      this.particlesSubject.next(updated);
    }, 1500);
  }

  // Prestige System
  getPrestigeData(): PrestigeData {
    const requiredCandy = this.calculatePrestigeRequirement();
    const prestigePointsGained = this.calculatePrestigePoints();
    const newMultiplier = this.calculateNewPrestigeMultiplier(this.gameState.prestigePoints + prestigePointsGained);
    const canPrestige = this.gameState.totalCandyEarned >= requiredCandy;

    return {
      requiredCandy,
      prestigePointsGained,
      newMultiplier,
      canPrestige
    };
  }

  private calculatePrestigeRequirement(): number {
    const baseRequirement = 1000000; // 1 million for first prestige
    return Math.floor(baseRequirement * Math.pow(10, this.gameState.prestigeLevel));
  }

  private calculatePrestigePoints(): number {
    if (this.gameState.totalCandyEarned < this.calculatePrestigeRequirement()) {
      return 0;
    }
    
    // More candy earned = more prestige points
    const candyRatio = this.gameState.totalCandyEarned / this.calculatePrestigeRequirement();
    return Math.floor(Math.sqrt(candyRatio) * (1 + this.gameState.prestigeLevel * 0.1));
  }

  private calculateNewPrestigeMultiplier(totalPrestigePoints: number): number {
    return 1 + (totalPrestigePoints * 0.1); // Each prestige point gives 10% multiplier
  }

  performPrestige(): boolean {
    // Track user interaction for session validation
    this.gameState.lastUserInteraction = Date.now();
    
    const prestigeData = this.getPrestigeData();
    
    if (!prestigeData.canPrestige) {
      return false;
    }

    // Store prestige progress
    this.gameState.prestigeLevel++;
    this.gameState.prestigePoints += prestigeData.prestigePointsGained;
    this.gameState.totalPrestigePoints += prestigeData.prestigePointsGained;
    this.gameState.prestigeMultiplier = prestigeData.newMultiplier;

    // Reset progress but keep prestige stats
    const sessionId = this.generateSessionId();
    this.gameState = {
      ...this.getInitialGameState(),
      sessionId,
      prestigeLevel: this.gameState.prestigeLevel,
      prestigePoints: this.gameState.prestigePoints,
      prestigeMultiplier: this.gameState.prestigeMultiplier,
      totalPrestigePoints: this.gameState.totalPrestigePoints
    };

    // Clear visual effects
    this.floatingNumbersSubject.next([]);
    this.particlesSubject.next([]);
    this.flyingCandiesSubject.next([]);

    this.gameStateSubject.next(this.gameState);
    this.updateUnlockedUpgrades();
    
    return true;
  }

  // Game management
  resetGame(): void {
    localStorage.removeItem(this.SAVE_KEY);
    this.gameState = this.getInitialGameState();
    this.gameStateSubject.next(this.gameState);
    this.floatingNumbersSubject.next([]);
    this.particlesSubject.next([]);
    this.flyingCandiesSubject.next([]);
  }

  // Utility methods
  formatNumber(num: number): string {
    if (isNaN(num) || !isFinite(num)) return '0';
    if (num < 1000) return Math.floor(num).toString();
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
    if (num < 1000000000000) return (num / 1000000000).toFixed(1) + 'B';
    return (num / 1000000000000).toFixed(1) + 'T';
  }

  getAvailableUpgrades(): CandyUpgrade[] {
    return CANDY_UPGRADES.filter(upgrade => this.isUpgradeUnlocked(upgrade.id));
  }

  ngOnDestroy(): void {
    this.productionSubscription?.unsubscribe();
    this.autosaveSubscription?.unsubscribe();
    this.serverSaveSubscription?.unsubscribe();
    this.serverSyncSubscription?.unsubscribe();
    this.flyingCandySubscription?.unsubscribe();
    this.flyingCandyAnimationSubscription?.unsubscribe();
    this.saveGameState();
  }
}