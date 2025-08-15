import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { 
  GameState, 
  CandyUpgrade, 
  UpgradePurchaseResult, 
  ProductionTick,
  ClickEvent,
  FloatingNumber,
  Particle
} from '../models/candy-factory.interface';
import { CANDY_UPGRADES } from '../models/candy-upgrades.data';

@Injectable({
  providedIn: 'root'
})
export class CandyFactoryService {
  private readonly SAVE_KEY = 'cosmic-candy-factory-save';
  private readonly PRODUCTION_INTERVAL = 100; // Update every 100ms for smooth production
  private readonly AUTOSAVE_INTERVAL = 1000; // Autosave every second

  private gameState: GameState;
  private gameStateSubject = new BehaviorSubject<GameState>(this.getInitialGameState());
  private productionSubscription?: Subscription;
  private autosaveSubscription?: Subscription;

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

  constructor() {
    this.gameState = this.loadGameState() || this.getInitialGameState();
    this.gameStateSubject.next(this.gameState);
    this.startProductionLoop();
    this.startAutosave();
    this.updateUnlockedUpgrades();
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
      startTime: Date.now()
    };
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Core clicking functionality
  clickPlanet(event: { clientX: number, clientY: number }): void {
    const candyEarned = this.gameState.clickPower;
    this.gameState.candy += candyEarned;
    this.gameState.totalCandyEarned += candyEarned;

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
    // Calculate click power
    this.gameState.clickPower = 1; // Base click power
    for (const upgrade of CANDY_UPGRADES.filter(u => u.type === 'click')) {
      const level = this.gameState.upgrades[upgrade.id] || 0;
      this.gameState.clickPower += level * upgrade.powerPerLevel;
    }

    // Calculate production per second
    this.gameState.productionPerSecond = 0;
    for (const upgrade of CANDY_UPGRADES.filter(u => u.type === 'production')) {
      const level = this.gameState.upgrades[upgrade.id] || 0;
      this.gameState.productionPerSecond += level * (upgrade.productionPerSecond || 0);
    }
  }

  // Production loop
  private startProductionLoop(): void {
    this.productionSubscription = interval(this.PRODUCTION_INTERVAL).subscribe(() => {
      if (this.gameState.productionPerSecond > 0) {
        const candyToAdd = (this.gameState.productionPerSecond * this.PRODUCTION_INTERVAL) / 1000;
        this.gameState.candy += candyToAdd;
        this.gameState.totalCandyEarned += candyToAdd;
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
    // Recalculate derived stats after loading
    const tempState = this.gameState;
    this.gameState = state;
    this.recalculateStats();
    if (!tempState) {
      this.gameState = state;
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

  // Game management
  resetGame(): void {
    localStorage.removeItem(this.SAVE_KEY);
    this.gameState = this.getInitialGameState();
    this.gameStateSubject.next(this.gameState);
    this.floatingNumbersSubject.next([]);
    this.particlesSubject.next([]);
  }

  // Utility methods
  formatNumber(num: number): string {
    if (num < 1000) return Math.floor(num).toString();
    if (num < 1000000) return (Math.floor(num / 100) / 10).toFixed(1) + 'K';
    if (num < 1000000000) return (Math.floor(num / 100000) / 10).toFixed(1) + 'M';
    if (num < 1000000000000) return (Math.floor(num / 100000000) / 10).toFixed(1) + 'B';
    return (Math.floor(num / 100000000000) / 10).toFixed(1) + 'T';
  }

  getAvailableUpgrades(): CandyUpgrade[] {
    return CANDY_UPGRADES.filter(upgrade => this.isUpgradeUnlocked(upgrade.id));
  }

  ngOnDestroy(): void {
    this.productionSubscription?.unsubscribe();
    this.autosaveSubscription?.unsubscribe();
    this.saveGameState();
  }
}