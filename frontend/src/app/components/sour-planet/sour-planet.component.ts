/**
 * SourPlanetComponent - Sour Planet with pH Balance Mechanics
 * 
 * Features:
 * - pH Balance Management (optimal range: 4.0 - 6.5)
 * - Fermentation System
 * - Acidic candy production
 * - Special sour-specific upgrades
 * - pH adjustment tools
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PlanetSystemService } from '../../services/planet-system.service';
import { 
  PlanetType, 
  EnhancedGameState, 
  PlanetState
} from '../../models/planet-system.interface';

// Import refactored sub-components
import { LemonClickerComponent } from './lemon-clicker/lemon-clicker.component';
import { PhBalanceSystemComponent } from './ph-balance-system/ph-balance-system.component';
import { UpgradesPanelComponent } from './upgrades-panel/upgrades-panel.component';

// Import unified planet header
import { PlanetHeaderComponent, PlanetTheme, ResourceData, PlanetNavItem } from '../shared/planet-header/planet-header.component';

interface PHBalanceMechanics {
  level: number;
  naturalAcidification: number;
  productionModifier: number;
  totalAcidEvents: number;
  fermentationActive?: boolean;
  fermentationProgress?: number;
}

// Sour Planet Upgrade Interface
interface SourUpgrade {
  id: string;
  name: string;
  description: string;
  icon: string;
  baseCost: number;
  costMultiplier: number;
  productionBonus: number;
  unlockRequirement?: {
    candy?: number;
    level?: number;
    other?: string;
  };
}

@Component({
  selector: 'app-sour-planet',
  standalone: true,
  imports: [
    CommonModule,
    PlanetHeaderComponent,
    LemonClickerComponent,
    PhBalanceSystemComponent,
    UpgradesPanelComponent
  ],
  template: `
    <div class="sour-planet-layout" [style.background]="sourPlanetBackground" [class.loading]="isLoading">
      <!-- Unified Planet Header with Navigation -->
      <app-planet-header
        [theme]="sourTheme"
        [resources]="resourceData"
        [planets]="availablePlanets"
        [currentPlanetId]="'sour'"
        [isLoading]="isLoading"
        [showBreadcrumb]="false"
        [showPrimaryActions]="false"
        [showQuickActions]="false"
        (backClicked)="navigateToSolarSystem()">
      </app-planet-header>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-state">
        <div class="loading-spinner">🌀</div>
        <p>Loading Sour Planet...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error && !isLoading" class="error-state">
        <div class="error-icon">⚠️</div>
        <p class="error-message">{{ error }}</p>
        <button class="retry-button" (click)="loadPlanetData()">Retry</button>
      </div>

      <!-- Main Game Interface -->
      <div *ngIf="!isLoading && !error" class="planet-game">

        <!-- Game Area with Side-by-Side Layout -->
        <div class="game-area">
          
          <!-- Main Content Area -->
          <div class="main-content">
            <!-- Planet Container -->
            <div class="planet-container">
              
              <!-- Lemon Clicker Component - TOP POSITION -->
              <app-lemon-clicker
                [clickPower]="planetState?.clickPower || 1"
                [phModifier]="getPhProductionModifier()"
                [disabled]="isLoading"
                [isOptimalPh]="isPhOptimal"
                [instructionText]="'Click the lemon to make sour candy!'"
                (candyClicked)="onCandyClicked($event)">
              </app-lemon-clicker>

              <!-- pH Balance System Component with Integrated Fermentation - BELOW LEMON -->
              <app-ph-balance-system
                [phBalance]="phBalance"
                [canAdjustPH]="canAdjustPH"
                [canStartFermentation]="canStartFermentation"
                (phAdjusted)="onPhAdjusted($event)"
                (fermentationStarted)="onFermentationStarted()">
              </app-ph-balance-system>

            </div>
          </div>
          
          <!-- Upgrades Panel Component -->
          <app-upgrades-panel
            [upgrades]="sourUpgrades"
            [planetState]="planetState"
            (upgradePurchased)="onUpgradePurchased($event)">
          </app-upgrades-panel>
        </div>
      </div>
    </div>
  `,
  styleUrl: './sour-planet.component.scss'
})
export class SourPlanetComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private testMode = true; // Enable test mode to avoid service interference
  
  // Component state
  gameState: EnhancedGameState | null = null;
  planetState: PlanetState | null = null;
  phBalance: PHBalanceMechanics | null = null;
  
  // UI state
  isLoading = false; // Start with false to avoid loading issues
  error: string | null = null;
  // Removed individual UI state - now handled by sub-components

  // Unified Header Configuration
  sourTheme: PlanetTheme = PlanetHeaderComponent.createTheme('sour', {
    name: 'Sour Planet',
    subtitle: 'pH Balance & Fermentation Laboratory',
    backgroundIcon: 'beaker.png',
    labEquipment: ['⚗️', '🧪']
  });

  // Background style with proper gradient and image
  get sourPlanetBackground(): string {
    return 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%), url(sour_candy_background.png) center/cover no-repeat';
  }

  // Available planets for navigation
  availablePlanets: PlanetNavItem[] = [
    { id: 'sweet', name: 'Sweet Planet', icon: '🍭', route: '/planet/sweet', unlocked: true },
    { id: 'sour', name: 'Sour Planet', icon: '🍋', route: '/planet/sour', unlocked: true },
    { id: 'cold', name: 'Cold Planet', icon: '❄️', route: '/planet/cold', unlocked: false },
    { id: 'spicy', name: 'Spicy Planet', icon: '🌶️', route: '/planet/spicy', unlocked: false }
  ];

  // Resource data for header display
  get resourceData(): ResourceData | null {
    if (!this.planetState) return null;
    
    return {
      candy: this.planetState.candy || 0,
      crystals: 0, // Sour planet doesn't use crystals
      productionPerSecond: this.planetState.productionPerSecond || 0,
      specialResources: {
        clickPower: this.planetState.clickPower || 1, // Click power for Sour Planet
        ph: this.phBalance?.level || 7.0
      }
    };
  }
  

  // Sour Planet Upgrades (Design Guide Compliant Icons)
  sourUpgrades: SourUpgrade[] = [
    {
      id: 'lemon_juicer',
      name: 'Lemon Juicer',
      description: 'Automated lemon juicing increases candy production',
      icon: 'gears.png',
      baseCost: 10,
      costMultiplier: 1.15,
      productionBonus: 0.5,
    },
    {
      id: 'citric_mixer',
      name: 'Citric Acid Mixer',
      description: 'Advanced mixing creates more sour candy per second',
      icon: 'fluid_lind.png',
      baseCost: 50,
      costMultiplier: 1.2,
      productionBonus: 1.5,
    },
    {
      id: 'fermentation_vat',
      name: 'Fermentation Vat',
      description: 'Large-scale fermentation boosts production significantly',
      icon: 'nebula_mise.png',
      baseCost: 200,
      costMultiplier: 1.25,
      productionBonus: 4.0,
    },
    {
      id: 'ph_stabilizer',
      name: 'pH Auto-Stabilizer',
      description: 'Automatically maintains optimal pH for maximum efficiency',
      icon: 'molecular.png',
      baseCost: 500,
      costMultiplier: 1.3,
      productionBonus: 2.0,
      unlockRequirement: { candy: 1000 }
    },
    {
      id: 'sour_synthesizer',
      name: 'Molecular Sour Synthesizer',
      description: 'Quantum-level sourness enhancement technology',
      icon: 'molecular.png',
      baseCost: 2000,
      costMultiplier: 1.4,
      productionBonus: 10.0,
      unlockRequirement: { candy: 5000 }
    }
  ];

  // Computed properties
  get isPhOptimal(): boolean {
    const ph = this.phBalance?.level || 7;
    return ph >= 4.0 && ph <= 6.5;
  }

  get isPhDangerous(): boolean {
    const ph = this.phBalance?.level || 7;
    return ph < 2.0 || ph > 12.0;
  }

  get canAdjustPH(): boolean {
    return !this.isLoading && this.planetState?.unlocked === true;
  }

  get canStartFermentation(): boolean {
    return this.isPhOptimal && !this.phBalance?.fermentationActive;
  }

  constructor(
    private planetSystemService: PlanetSystemService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    // Initialize default sour planet state immediately for testing
    this.initializeTestState();
    
    // Always start the game loop for pH drift and auto-production
    this.startGameLoop();
    
    if (this.testMode) {
      console.log('Running in test mode - skipping service interactions');
      return;
    }
    
    // Subscribe to game state changes first
    this.subscribeToGameState();
    
    // Try to switch to sour planet in the system service
    try {
      await this.planetSystemService.switchToPlanet('sour');
    } catch (error) {
      console.warn('Failed to switch to sour planet through service:', error);
    }
    
    // Load and validate planet data
    await this.loadPlanetData();
  }
  
  /**
   * Initialize basic test state to ensure the component works
   */
  private initializeTestState(): void {
    this.planetState = {
      id: 'sour',
      unlocked: true,
      candy: 100,
      clickPower: 1,
      productionPerSecond: 2, // Give some initial auto-production
      upgrades: {},
      unlockedUpgrades: [],
      specialMechanics: {
        phBalance: {
          level: 5.0, // Set to optimal pH range (4.0-6.5)
          naturalAcidification: 0.1,
          productionModifier: 1.0, // Optimal modifier
          totalAcidEvents: 0
        }
      },
      resources: { exports: {}, imports: {} },
      achievements: {},
      discoveredCandies: [],
      lastActive: Date.now(),
      totalTimeActive: 0,
      totalClicks: 0
    };
    
    this.phBalance = {
      level: 5.0, // Set to optimal pH range (4.0-6.5)
      naturalAcidification: 0.1,
      productionModifier: 1.0, // Optimal modifier
      totalAcidEvents: 0,
      fermentationActive: false,
      fermentationProgress: 0
    };

    // Update production rate based on any existing upgrades
    this.updateProductionRate();
    
    this.isLoading = false;
    this.error = null;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribe to game state changes (disabled in test mode)
   */
  private subscribeToGameState(): void {
    if (!this.testMode) {
      this.planetSystemService.gameState
        .pipe(takeUntil(this.destroy$))
        .subscribe(gameState => {
          if (gameState) {
            this.gameState = gameState;
            this.updatePlanetState(gameState);
          }
        });
    } else {
      console.log('Game state subscription disabled in test mode');
    }
  }

  /**
   * Update planet-specific state
   */
  private updatePlanetState(gameState: EnhancedGameState): void {
    this.planetState = gameState.planets.sour;
    
    // Only update pH balance if we don't already have a test state set up
    if (!this.phBalance) {
      if (this.planetState?.specialMechanics?.phBalance) {
        const existing = this.planetState.specialMechanics.phBalance;
        this.phBalance = {
          level: existing.level,
          naturalAcidification: existing.naturalAcidification,
          productionModifier: existing.productionModifier,
          totalAcidEvents: existing.totalAcidEvents,
          fermentationActive: false,
          fermentationProgress: 0
        };
      } else {
        // Initialize optimal pH mechanics for testing
        this.phBalance = {
          level: 5.0, // Optimal pH range
          naturalAcidification: 0.1,
          productionModifier: 1.0, // Optimal modifier
          totalAcidEvents: 0,
          fermentationActive: false,
          fermentationProgress: 0
        };
      }
    }
    
    // Ensure planet state is unlocked for testing
    if (this.planetState) {
      this.planetState.unlocked = true;
    }
  }

  /**
   * Load planet data with error handling
   */
  async loadPlanetData(): Promise<void> {
    try {
      this.isLoading = true;
      this.error = null;
      
      const gameState = this.planetSystemService.getCurrentGameState();
      if (gameState) {
        this.updatePlanetState(gameState);
        
        // Check if sour planet is unlocked
        if (!this.planetState?.unlocked) {
          this.error = 'Sour Planet is locked. Unlock by reaching 10,000 total candy across all planets.';
          this.isLoading = false;
          return;
        }
      } else {
        // No game state - try to initialize a basic unlocked state for testing
        console.warn('No game state found - initializing basic sour planet state for testing');
        this.planetState = {
          id: 'sour',
          unlocked: true,
          candy: 100,
          clickPower: 1,
          productionPerSecond: 0,
          upgrades: {},
          unlockedUpgrades: [],
          specialMechanics: {
            phBalance: {
              level: 7.0,
              naturalAcidification: 0.1,
              productionModifier: 0.8,
              totalAcidEvents: 0
            }
          },
          resources: { exports: {}, imports: {} },
          achievements: {},
          discoveredCandies: [],
          lastActive: Date.now(),
          totalTimeActive: 0,
          totalClicks: 0
        };
        
        this.phBalance = {
          level: 7.0,
          naturalAcidification: 0.1,
          productionModifier: 0.8,
          totalAcidEvents: 0,
          fermentationActive: false,
          fermentationProgress: 0
        };
      }
      
    } catch (err) {
      this.error = 'Failed to load Sour Planet data. Please try again.';
      console.error('Error loading sour planet:', err);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Handle candy clicked event from lemon-clicker component
   */
  async onCandyClicked(event: { x: number; y: number; value: number; timestamp: number }): Promise<void> {
    if (this.isLoading || !this.planetState) return;

    // Update candy count and click statistics
    this.planetState.candy = (this.planetState.candy || 0) + event.value;
    this.planetState.totalClicks = (this.planetState.totalClicks || 0) + 1;
    
    // Try to update planet through service, but don't fail if service isn't available
    try {
      await this.planetSystemService.clickPlanet({
        x: event.x,
        y: event.y,
        timestamp: event.timestamp
      });
    } catch (error) {
      console.warn('Planet system service not available, using local state only:', error);
    }
  }

  /**
   * Handle pH adjusted event from ph-balance-system component
   */
  async onPhAdjusted(delta: number): Promise<void> {
    if (!this.phBalance || !this.canAdjustPH) return;

    const newPH = Math.max(0, Math.min(14, this.phBalance.level + delta));
    this.phBalance.level = newPH;
    
    // Update production modifier based on new pH
    this.phBalance.productionModifier = this.getPhProductionModifier();
    
    // Save the change  
    if (this.gameState && this.planetState) {
      if (!this.planetState.specialMechanics) {
        this.planetState.specialMechanics = {};
      }
      this.planetState.specialMechanics.phBalance = {
        level: this.phBalance.level,
        naturalAcidification: this.phBalance.naturalAcidification,
        productionModifier: this.phBalance.productionModifier,
        totalAcidEvents: this.phBalance.totalAcidEvents
      };
      // In a full implementation, this would trigger a save through the service
      console.log(`pH adjusted to ${newPH.toFixed(1)}`);
    }
  }

  /**
   * Handle fermentation started event from fermentation-panel component
   */
  async onFermentationStarted(): Promise<void> {
    if (!this.canStartFermentation || !this.phBalance) return;

    this.phBalance.fermentationActive = true;
    this.phBalance.fermentationProgress = 0;

    console.log('Fermentation started!');
  }

  /**
   * Collect all candy from this planet
   */
  async collectCandy(): Promise<void> {
    if (!this.planetState || this.planetState.candy === 0) return;
    
    const collected = this.planetState.candy;
    this.planetState.candy = 0;
    
    console.log(`Collected ${collected} sour candy`);
  }

  /**
   * Navigate back to solar system
   */
  async navigateToSolarSystem(): Promise<void> {
    await this.router.navigate(['/solar-system']);
  }


  /**
   * Helper functions
   */
  getPhPercentage(): number {
    const ph = this.phBalance?.level || 7;
    return (ph / 14) * 100;
  }

  getPhProductionModifier(): number {
    const ph = this.phBalance?.level || 7;
    if (ph < 4.0) return 0.5;  // Too acidic
    if (ph > 6.5) return 0.7;  // Too alkaline  
    return 1.0; // Optimal
  }

  getFermentationBonus(): number {
    if (this.phBalance?.fermentationActive && this.phBalance.fermentationProgress !== undefined) {
      return Math.floor(this.phBalance.fermentationProgress * 50); // Up to 50% bonus
    }
    return 0;
  }

  formatNumber(value: number): string {
    if (value >= 1000000000) return (value / 1000000000).toFixed(1) + 'B';
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return Math.floor(value).toString();
  }

  // Floating numbers now handled by lemon-clicker component

  /**
   * Start the game loop for pH drift and automatic production
   */
  private startGameLoop(): void {
    // Main game loop - runs every 1 second for pH drift and production
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.planetState || !this.phBalance) return;

        // 1. Natural pH acidification over time
        this.processPhDrift();

        // 2. Automatic candy production based on productionPerSecond
        this.processAutomaticProduction();

        // 3. Update fermentation if active
        this.processFermentation();
      });
  }

  /**
   * Process natural pH drift over time (becomes more acidic)
   */
  private processPhDrift(): void {
    if (!this.phBalance) return;

    // Natural acidification - pH slowly decreases (becomes more acidic)
    const driftRate = this.phBalance.naturalAcidification || 0.01; // 0.01 pH per second
    const newPH = Math.max(1.0, this.phBalance.level - driftRate);
    
    if (newPH !== this.phBalance.level) {
      this.phBalance.level = newPH;
      
      // Update production modifier based on new pH
      this.phBalance.productionModifier = this.getPhProductionModifier();
      
      // Save to planet state
      if (this.planetState?.specialMechanics) {
        this.planetState.specialMechanics.phBalance = { ...this.phBalance };
      }
    }
  }

  /**
   * Get the current level of an upgrade
   */
  getUpgradeLevel(upgradeId: string): number {
    return this.planetState?.upgrades?.[upgradeId] || 0;
  }

  /**
   * Calculate the cost of the next level of an upgrade
   */
  getUpgradeCost(upgradeId: string): number {
    const upgrade = this.sourUpgrades.find(u => u.id === upgradeId);
    if (!upgrade) return 0;
    
    const currentLevel = this.getUpgradeLevel(upgradeId);
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
  }

  /**
   * Check if player can afford an upgrade
   */
  canAffordUpgrade(upgradeId: string): boolean {
    const cost = this.getUpgradeCost(upgradeId);
    const upgrade = this.sourUpgrades.find(u => u.id === upgradeId);
    const currentCandy = this.planetState?.candy || 0;
    
    // Check unlock requirements
    if (upgrade?.unlockRequirement) {
      if (upgrade.unlockRequirement.candy && currentCandy < upgrade.unlockRequirement.candy) {
        return false;
      }
    }
    
    return currentCandy >= cost;
  }

  /**
   * Handle upgrade purchased event from upgrades-panel component
   */
  onUpgradePurchased(upgradeId: string): void {
    const cost = this.getUpgradeCost(upgradeId);
    
    if (!this.canAffordUpgrade(upgradeId) || !this.planetState) {
      return;
    }
    
    // Deduct cost
    this.planetState.candy -= cost;
    
    // Increase upgrade level
    if (!this.planetState.upgrades) {
      this.planetState.upgrades = {};
    }
    this.planetState.upgrades[upgradeId] = (this.planetState.upgrades[upgradeId] || 0) + 1;
    
    // Add to unlocked upgrades if first purchase
    if (this.planetState.upgrades[upgradeId] === 1 && this.planetState.unlockedUpgrades) {
      if (!this.planetState.unlockedUpgrades.includes(upgradeId)) {
        this.planetState.unlockedUpgrades.push(upgradeId);
      }
    }
    
    // Recalculate production per second
    this.updateProductionRate();
    
    console.log(`🔬 Bought ${upgradeId} level ${this.planetState.upgrades[upgradeId]} for ${cost} candy`);
  }

  /**
   * Update production rate based on upgrades
   */
  private updateProductionRate(): void {
    if (!this.planetState) return;
    
    let baseProduction = 2; // Base production rate
    let upgradeBonus = 0;
    
    // Calculate upgrade bonuses
    this.sourUpgrades.forEach(upgrade => {
      const level = this.getUpgradeLevel(upgrade.id);
      if (level > 0) {
        upgradeBonus += upgrade.productionBonus * level;
      }
    });
    
    this.planetState.productionPerSecond = baseProduction + upgradeBonus;
    console.log(`⚡ Production updated: ${this.planetState.productionPerSecond}/sec (base: ${baseProduction}, upgrades: +${upgradeBonus})`);
  }

  /**
   * Process automatic candy production
   */
  private processAutomaticProduction(): void {
    if (!this.planetState || !this.phBalance) return;

    const productionPerSecond = this.planetState.productionPerSecond || 0;
    if (productionPerSecond > 0) {
      // Apply pH modifier to production
      const phModifier = this.phBalance.productionModifier || 1.0;
      const actualProduction = productionPerSecond * phModifier;
      
      // Add candy
      this.planetState.candy += actualProduction;
      
      console.log(`Auto-production: +${actualProduction.toFixed(2)} sour candy (pH modifier: ${phModifier.toFixed(2)})`);
    }
  }

  /**
   * Process active fermentation
   */
  private processFermentation(): void {
    if (!this.phBalance?.fermentationActive) return;

    // Fermentation progress
    if (this.phBalance.fermentationProgress !== undefined) {
      this.phBalance.fermentationProgress += 0.02; // 50 seconds to complete
      
      if (this.phBalance.fermentationProgress >= 1.0) {
        // Fermentation complete - apply bonus
        this.phBalance.fermentationActive = false;
        this.phBalance.fermentationProgress = 0;
        
        // Give fermentation bonus
        const bonus = 50; // Flat bonus for now
        if (this.planetState) {
          this.planetState.candy += bonus;
        }
        
        console.log(`🫙 Fermentation complete! Gained ${bonus} bonus sour candy!`);
      }
    }
  }
}