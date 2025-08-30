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

interface PHBalanceMechanics {
  level: number;
  naturalAcidification: number;
  productionModifier: number;
  totalAcidEvents: number;
  fermentationActive?: boolean;
  fermentationProgress?: number;
}

@Component({
  selector: 'app-sour-planet',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sour-planet" [class.loading]="isLoading">
      <!-- Navigation Header -->
      <div class="planet-header">
        <button class="back-button" (click)="navigateToSolarSystem()">
          ← Back to Solar System
        </button>
        <h1 class="planet-title">
          🍋 Sour Planet
          <span class="planet-subtitle">pH Balance & Fermentation</span>
        </h1>
      </div>

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
        
        <!-- Stats Display -->
        <div class="stats-panel">
          <div class="stat-group">
            <div class="stat-item candy">
              <span class="stat-icon">🍬</span>
              <span class="stat-value">{{ formatNumber(planetState?.candy || 0) }}</span>
              <span class="stat-label">Sour Candy</span>
            </div>
            
            <div class="stat-item production">
              <span class="stat-icon">⚡</span>
              <span class="stat-value">{{ formatNumber(planetState?.productionPerSecond || 0) }}/sec</span>
              <span class="stat-label">Production</span>
            </div>
            
            <div class="stat-item click-power">
              <span class="stat-icon">👆</span>
              <span class="stat-value">{{ formatNumber(planetState?.clickPower || 1) }}</span>
              <span class="stat-label">Per Click</span>
            </div>
          </div>
        </div>

        <!-- pH Balance System -->
        <div class="ph-balance-panel">
          <div class="ph-header">
            <h2>🧪 pH Balance System</h2>
            <div class="ph-value" [class.optimal]="isPhOptimal" [class.danger]="isPhDangerous">
              pH {{ phBalance?.level?.toFixed(1) || '7.0' }}
            </div>
          </div>
          
          <div class="ph-meter">
            <div class="ph-scale">
              <div class="ph-indicator" [style.left.%]="getPhPercentage()"></div>
              <div class="ph-optimal-zone"></div>
            </div>
            <div class="ph-labels">
              <span class="ph-label acidic">Acidic (0)</span>
              <span class="ph-label optimal">Optimal (4-6.5)</span>
              <span class="ph-label alkaline">Alkaline (14)</span>
            </div>
          </div>

          <div class="ph-effects">
            <div class="effect-item" [class.active]="(phBalance?.level || 7) < 4">
              <span class="effect-icon">⚠️</span>
              <span class="effect-text">Too Acidic: -50% Production</span>
            </div>
            <div class="effect-item" [class.active]="isPhOptimal">
              <span class="effect-icon">✅</span>
              <span class="effect-text">Optimal pH: Normal Production</span>
            </div>
            <div class="effect-item" [class.active]="(phBalance?.level || 7) > 6.5">
              <span class="effect-icon">⚠️</span>
              <span class="effect-text">Too Alkaline: -30% Production</span>
            </div>
          </div>

          <!-- pH Adjustment Controls -->
          <div class="ph-controls">
            <button 
              class="ph-adjust acidify" 
              (click)="adjustPH(-0.5)"
              [disabled]="!canAdjustPH || (phBalance?.level || 7) <= 1">
              🍋 Acidify (-0.5)
            </button>
            <button 
              class="ph-adjust neutralize" 
              (click)="adjustPH(0.5)"
              [disabled]="!canAdjustPH || (phBalance?.level || 7) >= 13">
              🧂 Neutralize (+0.5)
            </button>
          </div>
        </div>

        <!-- Fermentation System -->
        <div class="fermentation-panel" *ngIf="phBalance?.fermentationActive">
          <div class="fermentation-header">
            <h3>🫙 Active Fermentation</h3>
            <div class="fermentation-progress">
              {{ ((phBalance?.fermentationProgress || 0) * 100).toFixed(0) }}%
            </div>
          </div>
          
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="(phBalance?.fermentationProgress || 0) * 100"></div>
          </div>
          
          <p class="fermentation-description">
            Fermentation increases production by {{ getFermentationBonus() }}% when pH is optimal
          </p>
        </div>

        <!-- Main Candy Clicker -->
        <div class="candy-clicker">
          <button 
            class="candy-button sour-candy" 
            (click)="clickCandy($event)"
            [disabled]="isLoading">
            <div class="candy-icon">🍋</div>
            <div class="click-effect" *ngIf="showClickEffect"></div>
          </button>
          <p class="click-instruction">Click to make sour candy!</p>
        </div>

        <!-- Floating Numbers -->
        <div class="floating-numbers" #floatingContainer>
          <div 
            *ngFor="let number of floatingNumbers" 
            class="floating-number"
            [style.left.px]="number.x"
            [style.top.px]="number.y"
            [style.color]="number.color">
            +{{ formatNumber(number.value) }}
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <button class="action-btn" (click)="navigateToSolarSystem()">
            🌌 Solar System
          </button>
          <button class="action-btn" (click)="startFermentation()" [disabled]="!canStartFermentation">
            🫙 Start Fermentation
          </button>
          <button class="action-btn" (click)="collectCandy()" [disabled]="(planetState?.candy || 0) === 0">
            🍬 Collect All
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './sour-planet.component.css'
})
export class SourPlanetComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Component state
  gameState: EnhancedGameState | null = null;
  planetState: PlanetState | null = null;
  phBalance: PHBalanceMechanics | null = null;
  
  // UI state
  isLoading = true;
  error: string | null = null;
  showClickEffect = false;
  floatingNumbers: Array<{ x: number; y: number; value: number; color: string }> = [];

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

  ngOnInit(): void {
    this.loadPlanetData();
    this.subscribeToGameState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribe to game state changes
   */
  private subscribeToGameState(): void {
    this.planetSystemService.gameState
      .pipe(takeUntil(this.destroy$))
      .subscribe(gameState => {
        if (gameState) {
          this.gameState = gameState;
          this.updatePlanetState(gameState);
          this.isLoading = false;
          this.error = null;
        }
      });

    // Switch to sour planet when component loads
    this.planetSystemService.switchToPlanet('sour');
  }

  /**
   * Update planet-specific state
   */
  private updatePlanetState(gameState: EnhancedGameState): void {
    this.planetState = gameState.planets.sour;
    
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
      // Initialize default pH mechanics if missing
      this.phBalance = {
        level: 7.0,
        naturalAcidification: 0.1,
        productionModifier: 0.8,
        totalAcidEvents: 0,
        fermentationActive: false,
        fermentationProgress: 0
      };
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
      }
      
      // Check if sour planet is unlocked
      if (!this.planetState?.unlocked) {
        this.error = 'Sour Planet is locked. Unlock by reaching 10,000 total candy across all planets.';
        return;
      }
      
    } catch (err) {
      this.error = 'Failed to load Sour Planet data. Please try again.';
      console.error('Error loading sour planet:', err);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Handle candy clicking
   */
  async clickCandy(event: MouseEvent): Promise<void> {
    if (this.isLoading || !this.planetState) return;

    const clickPower = this.planetState.clickPower;
    const phModifier = this.getPhProductionModifier();
    const actualGain = Math.floor(clickPower * phModifier);
    
    // Add floating number animation
    this.addFloatingNumber(event.clientX, event.clientY, actualGain);
    
    // Show click effect
    this.showClickEffect = true;
    setTimeout(() => this.showClickEffect = false, 200);
    
    // Update planet through service
    await this.planetSystemService.clickPlanet({
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now()
    });
  }

  /**
   * Adjust pH level
   */
  async adjustPH(delta: number): Promise<void> {
    if (!this.phBalance || !this.canAdjustPH) return;

    const newPH = Math.max(0, Math.min(14, this.phBalance.level + delta));
    this.phBalance.level = newPH;
    
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
   * Start fermentation process
   */
  async startFermentation(): Promise<void> {
    if (!this.canStartFermentation || !this.phBalance) return;

    this.phBalance.fermentationActive = true;
    this.phBalance.fermentationProgress = 0;

    // Simulate fermentation progress
    const fermentationTimer = interval(1000).pipe(takeUntil(this.destroy$));
    fermentationTimer.subscribe(() => {
      if (this.phBalance && this.phBalance.fermentationActive && this.phBalance.fermentationProgress !== undefined) {
        this.phBalance.fermentationProgress += 0.02; // 50 seconds to complete
        
        if (this.phBalance.fermentationProgress >= 1.0) {
          this.phBalance.fermentationActive = false;
          this.phBalance.fermentationProgress = 0;
          console.log('Fermentation complete! Production bonus applied.');
        }
      }
    });
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

  private addFloatingNumber(x: number, y: number, value: number): void {
    const floatingNumber = {
      x: x - 50, // Center on click
      y: y - 20,
      value,
      color: this.isPhOptimal ? '#32CD32' : '#FF6B6B'
    };
    
    this.floatingNumbers.push(floatingNumber);
    
    // Remove after animation
    setTimeout(() => {
      const index = this.floatingNumbers.indexOf(floatingNumber);
      if (index > -1) {
        this.floatingNumbers.splice(index, 1);
      }
    }, 2000);
  }
}