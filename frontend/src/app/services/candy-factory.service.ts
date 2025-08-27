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
  private readonly AUTOSAVE_INTERVAL = 1000; // Autosave every second
  private readonly SERVER_SYNC_INTERVAL = 30000; // Sync with server every 30 seconds
  private readonly FLYING_CANDY_INTERVAL = 8000; // Spawn flying candy every 8 seconds
  private readonly FLYING_CANDY_LIFETIME = 12000; // Flying candy lasts 12 seconds

  private gameState: GameState;
  private gameStateSubject = new BehaviorSubject<GameState>(this.getInitialGameState());
  private productionSubscription?: Subscription;
  private autosaveSubscription?: Subscription;
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
    this.gameState = this.loadGameState() || this.getInitialGameState();
    this.gameStateSubject.next(this.gameState);
    this.startProductionLoop();
    this.startAutosave();
    this.startServerSync();
    this.startFlyingCandySystem();
    this.updateUnlockedUpgrades();
    this.achievementService.updateAchievements(this.gameState);
    
    // Try to load game state from server if user is authenticated
    this.loadFromServerIfAuthenticated();
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

  // Core clicking functionality
  clickPlanet(event: { clientX: number, clientY: number }): void {
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

  private saveGameState(): void {
    this.gameState.lastSaved = Date.now();
    localStorage.setItem(this.SAVE_KEY, JSON.stringify(this.gameState));
    
    // Also save to server if user is authenticated (async, don't wait)
    this.saveToServer().catch(error => {
      console.error('Background server save failed:', error);
    });
  }

  private loadGameState(): GameState | null {
    try {
      const saved = localStorage.getItem(this.SAVE_KEY);
      if (saved) {
        const state = JSON.parse(saved) as GameState;
        this.recalculateStatsForLoadedState(state);
        return state;
      }
    } catch (error) {
      console.error('Failed to load game state:', error);
    }
    return null;
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
    
    // Recalculate derived stats after loading
    const tempState = this.gameState;
    this.gameState = state;
    this.recalculateStats();
    if (!tempState) {
      this.gameState = state;
    }
  }

  // Server synchronization methods
  private async loadFromServerIfAuthenticated(): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    try {
      const serverGameState = await this.gameApiService.loadGameState();
      if (serverGameState) {
        console.log('Loaded game state from server');
        this.gameState = serverGameState;
        this.recalculateStatsForLoadedState(this.gameState);
        this.gameStateSubject.next(this.gameState);
        this.updateUnlockedUpgrades();
        this.achievementService.updateAchievements(this.gameState);
      }
    } catch (error) {
      console.error('Failed to load game state from server:', error);
    }
  }

  /**
   * Update game state with server data - used by migration service
   */
  public updateGameStateFromServer(serverData: GameState): void {
    console.log('Updating game state from server data via migration:', serverData);
    this.gameState = serverData;
    this.recalculateStatsForLoadedState(this.gameState);
    this.gameStateSubject.next(this.gameState);
    this.updateUnlockedUpgrades();
    this.achievementService.updateAchievements(this.gameState);
    this.saveGameState(); // Save to localStorage to maintain consistency
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

    try {
      const syncResult = await this.gameApiService.syncGameState(this.gameState);
      if (syncResult) {
        if (syncResult.conflictResolved) {
          console.log('Game state conflict resolved:', syncResult.message);
          this.gameState = syncResult.gameData;
          this.recalculateStatsForLoadedState(this.gameState);
          this.gameStateSubject.next(this.gameState);
          this.updateUnlockedUpgrades();
          this.achievementService.updateAchievements(this.gameState);
        }
      }
    } catch (error) {
      console.error('Failed to sync with server:', error);
    }
  }

  private async saveToServer(): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    try {
      await this.gameApiService.saveGameState(this.gameState);
    } catch (error) {
      console.error('Failed to save game state to server:', error);
    }
  }

  // Public method to manually sync with server
  public async manualSync(): Promise<boolean> {
    if (!this.authService.isAuthenticated()) {
      console.warn('Cannot sync: user not authenticated');
      return false;
    }

    try {
      await this.syncWithServer();
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
    this.serverSyncSubscription?.unsubscribe();
    this.flyingCandySubscription?.unsubscribe();
    this.flyingCandyAnimationSubscription?.unsubscribe();
    this.saveGameState();
  }
}