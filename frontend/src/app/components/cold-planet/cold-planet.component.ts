/**
 * ColdPlanetComponent - Cold Planet with Temperature & Crystallization Mechanics
 * 
 * Features:
 * - Temperature Management (-50°C to 0°C)
 * - Crystallization System (auto-crystallization at threshold)
 * - Preservation Value (10x multiplier for crystallized candy)
 * - Ice Age Cycles
 * - Crystal Cavern Exploration
 * - Aurora Events
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
import { ColdPlanetMechanics } from '../../models/planet-mechanics.interface';

@Component({
  selector: 'app-cold-planet',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cold-planet" [class.loading]="isLoading">
      <!-- Navigation Header -->
      <div class="planet-header">
        <button class="back-button" (click)="navigateToSolarSystem()">
          ← Back to Solar System
        </button>
        <h1 class="planet-title">
          🧊 Cold Planet
          <span class="planet-subtitle">Temperature & Crystallization</span>
        </h1>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-state">
        <div class="loading-spinner">❄️</div>
        <p>Loading Cold Planet...</p>
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
              <span class="stat-label">Cold Candy</span>
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

            <div class="stat-item crystallized">
              <span class="stat-icon">💎</span>
              <span class="stat-value">{{ formatNumber(temperatureMechanics?.crystallization?.crystallizedCandy || 0) }}</span>
              <span class="stat-label">Crystallized</span>
            </div>
          </div>
        </div>

        <!-- Temperature Management Section -->
        <div class="temperature-section">
          <h2 class="section-title">
            <span class="title-icon">🌡️</span>
            Temperature Control
            <span class="temp-value" [class]="getTemperatureClass()">
              {{ (temperatureMechanics?.temperature || -10).toFixed(1) }}°C
            </span>
          </h2>
          
          <!-- Temperature Gauge -->
          <div class="temperature-gauge">
            <div class="gauge-track">
              <div class="gauge-fill" [style.width.%]="getTemperaturePercentage()"></div>
              <div class="optimal-range" [style.left.%]="getOptimalRangeStart()" [style.width.%]="getOptimalRangeWidth()">
                <span class="range-label">Optimal</span>
              </div>
              <div class="gauge-indicator" [style.left.%]="getTemperaturePercentage()">
                <div class="indicator-dot"></div>
              </div>
            </div>
            <div class="gauge-labels">
              <span class="min-temp">-50°C</span>
              <span class="crystallization-temp">{{ (temperatureMechanics?.crystallization?.threshold || -30).toFixed(0) }}°C</span>
              <span class="max-temp">0°C</span>
            </div>
          </div>

          <!-- Temperature Controls -->
          <div class="temperature-controls">
            <button 
              class="temp-button cooling" 
              (click)="adjustTemperature(-5)"
              [disabled]="!canAdjustTemperature || (temperatureMechanics?.temperature || 0) <= -50">
              ❄️ Cool Down
            </button>
            
            <button 
              class="temp-button heating" 
              (click)="adjustTemperature(5)"
              [disabled]="!canAdjustTemperature || (temperatureMechanics?.temperature || 0) >= 0">
              🔥 Heat Up
            </button>
            
            <div class="temperature-status">
              <span class="status-text">{{ getTemperatureStatus() }}</span>
              <div class="modifiers">
                <span class="production-mod" *ngIf="temperatureMechanics?.temperatureModifier">
                  Production: {{ ((temperatureMechanics?.temperatureModifier || 1) * 100).toFixed(0) }}%
                </span>
                <span class="value-mod" *ngIf="temperatureMechanics?.valueModifier">
                  Value: {{ ((temperatureMechanics?.valueModifier || 1) * 100).toFixed(0) }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Crystallization Section -->
        <div class="crystallization-section">
          <h2 class="section-title">
            <span class="title-icon">💎</span>
            Crystallization Chamber
          </h2>
          
          <div class="crystallization-stats">
            <div class="crystal-stat">
              <span class="label">Regular Candy:</span>
              <span class="value">{{ formatNumber(temperatureMechanics?.crystallization?.regularCandy || 0) }}</span>
            </div>
            <div class="crystal-stat">
              <span class="label">Crystallized:</span>
              <span class="value highlight">{{ formatNumber(temperatureMechanics?.crystallization?.crystallizedCandy || 0) }}</span>
              <span class="multiplier">(10x value)</span>
            </div>
            <div class="crystal-stat">
              <span class="label">Total Crystallized:</span>
              <span class="value">{{ formatNumber(temperatureMechanics?.crystallization?.totalCrystallized || 0) }}</span>
            </div>
          </div>
          
          <div class="crystallization-controls">
            <button 
              class="crystal-button manual" 
              (click)="triggerCrystallization()"
              [disabled]="!canCrystallize()">
              ❄️ Manual Crystallize
            </button>
            
            <div class="auto-crystallization" *ngIf="isAutoCrystallizationActive()">
              <div class="auto-indicator">
                <span class="auto-icon">⚡</span>
                <span class="auto-text">Auto-crystallization active</span>
              </div>
              <div class="crystal-progress">
                <div class="progress-bar" [style.width.%]="getCrystallizationProgress()"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Click Area -->
        <div class="click-area">
          <div class="planet-display" (click)="clickPlanet()">
            <div class="planet-core" [class.crystallizing]="isAutoCrystallizationActive()">
              🧊
            </div>
            <div class="ice-effects" *ngIf="temperatureMechanics && temperatureMechanics.temperature < -30">
              <div class="ice-crystal">❄️</div>
              <div class="ice-crystal">❄️</div>
              <div class="ice-crystal">❄️</div>
            </div>
            <div class="aurora-effect" *ngIf="temperatureMechanics?.auroraEvents?.active">
              <div class="aurora-light northern"></div>
              <div class="aurora-light southern"></div>
            </div>
          </div>
        </div>

        <!-- Special Events -->
        <div class="events-section" *ngIf="hasActiveEvents()">
          
          <!-- Ice Age Event -->
          <div class="event-panel ice-age" *ngIf="temperatureMechanics?.iceAge?.active">
            <div class="event-header">
              <span class="event-icon">🧊</span>
              <h3 class="event-title">Ice Age Cycle</h3>
              <span class="event-phase">{{ temperatureMechanics?.iceAge?.cyclePhase | titlecase }}</span>
            </div>
            <div class="event-details">
              <p class="event-description">
                The planet is experiencing an ice age cycle. 
                Temperature shift: {{ (temperatureMechanics?.iceAge?.temperatureShift || 0) > 0 ? '+' : '' }}{{ temperatureMechanics?.iceAge?.temperatureShift || 0 }}°C
              </p>
              <div class="event-bonus" *ngIf="(temperatureMechanics?.iceAge?.adaptationBonus || 1) > 1">
                <span class="bonus-text">Adaptation Bonus: {{ ((temperatureMechanics?.iceAge?.adaptationBonus || 1) * 100).toFixed(0) }}%</span>
              </div>
            </div>
          </div>

          <!-- Aurora Event -->
          <div class="event-panel aurora" *ngIf="temperatureMechanics?.auroraEvents?.active">
            <div class="event-header">
              <span class="event-icon">🌌</span>
              <h3 class="event-title">Aurora {{ temperatureMechanics?.auroraEvents?.auroraType | titlecase }}</h3>
              <span class="event-intensity">Intensity: {{ temperatureMechanics?.auroraEvents?.intensity || 0 }}/10</span>
            </div>
            <div class="event-details">
              <p class="event-description">
                Beautiful aurora lights illuminate the planet!
              </p>
              <div class="event-bonus">
                <span class="bonus-text">Planet-wide Bonus: {{ ((temperatureMechanics?.auroraEvents?.planetWideBonus || 1) * 100).toFixed(0) }}%</span>
              </div>
            </div>
          </div>
          
        </div>

        <!-- Crystal Caverns -->
        <div class="caverns-section" *ngIf="temperatureMechanics?.crystalCaverns?.unlocked">
          <h2 class="section-title">
            <span class="title-icon">⛏️</span>
            Crystal Caverns
            <span class="depth-indicator">Depth: {{ temperatureMechanics?.crystalCaverns?.depth || 0 }}</span>
          </h2>
          
          <div class="excavation-progress">
            <div class="progress-label">Excavation Progress</div>
            <div class="progress-bar-container">
              <div class="progress-bar" [style.width.%]="(temperatureMechanics?.crystalCaverns?.excavationProgress || 0)"></div>
            </div>
            <div class="progress-text">{{ (temperatureMechanics?.crystalCaverns?.excavationProgress || 0).toFixed(1) }}%</div>
          </div>

          <button class="excavate-button" (click)="excavate()" [disabled]="!canExcavate()">
            ⛏️ Excavate Deeper
          </button>

          <div class="unique-crystals" *ngIf="(temperatureMechanics?.crystalCaverns?.uniqueCrystals?.length || 0) > 0">
            <h3>Discovered Crystals</h3>
            <div class="crystals-grid">
              <div 
                class="crystal-item" 
                *ngFor="let crystal of temperatureMechanics?.crystalCaverns?.uniqueCrystals || []"
                [class]="'crystal-' + crystal.rarity">
                <span class="crystal-icon" [innerHTML]="getCrystalIcon(crystal.type)"></span>
                <span class="crystal-type">{{ crystal.type | titlecase }}</span>
                <span class="crystal-rarity">{{ crystal.rarity | titlecase }}</span>
                <span class="crystal-value">{{ formatNumber(crystal.value) }}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styleUrls: ['./cold-planet.component.css']
})
export class ColdPlanetComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  gameState: EnhancedGameState | null = null;
  planetState: PlanetState | null = null;
  temperatureMechanics: ColdPlanetMechanics | null = null;
  
  isLoading = true;
  error: string | null = null;
  
  // UI state
  canAdjustTemperature = true;
  lastTemperatureAdjustment = 0;
  
  constructor(
    private planetSystemService: PlanetSystemService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPlanetData();
    this.startGameLoop();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadPlanetData(): Promise<void> {
    try {
      this.isLoading = true;
      this.error = null;
      
      // Get current game state from service
      this.gameState = this.planetSystemService.getCurrentGameState();
      
      if (!this.gameState) {
        throw new Error('Failed to load game state');
      }

      // Check if Cold Planet is unlocked
      if (!this.gameState.planets['cold']?.unlocked) {
        this.error = 'Cold Planet is locked. Unlock by reaching 50,000 total candy and completing 2 cross-planet recipes.';
        this.isLoading = false;
        return;
      }

      // Switch to Cold Planet
      const switchSuccess = await this.planetSystemService.switchToPlanet('cold');
      if (!switchSuccess) {
        throw new Error('Failed to switch to Cold Planet');
      }

      // Get updated game state
      this.gameState = this.planetSystemService.getCurrentGameState();
      if (!this.gameState) {
        throw new Error('Game state became null after planet switch');
      }

      this.planetState = this.gameState.planets['cold'];
      
      // Initialize or get temperature mechanics
      if (!this.planetState.specialMechanics || !this.planetState.specialMechanics.coldMechanics) {
        this.temperatureMechanics = this.initializeColdMechanics();
        this.planetState.specialMechanics = { coldMechanics: this.temperatureMechanics };
      } else {
        this.temperatureMechanics = this.planetState.specialMechanics.coldMechanics as ColdPlanetMechanics;
      }
      
      this.isLoading = false;
      console.log('Cold Planet loaded successfully');
      
    } catch (error) {
      console.error('Error loading Cold Planet:', error);
      this.error = error instanceof Error ? error.message : 'Unknown error occurred';
      this.isLoading = false;
    }
  }

  private initializeColdMechanics(): ColdPlanetMechanics {
    return {
      // Temperature management
      temperature: -10, // Start at -10°C
      optimalRange: [-35, -20],
      coolingRate: 2.0, // Can be upgraded
      heatLoss: 0.5, // Natural drift toward -10°C
      
      // Production vs preservation
      productionRate: 1.0,
      preservationValue: 1.0,
      temperatureModifier: 1.0,
      valueModifier: 1.0,
      
      // Crystallization system
      crystallization: {
        threshold: -30,
        regularCandy: 0,
        crystallizedCandy: 0,
        crystallizationRate: 0.1, // 10% per second when threshold met
        totalCrystallized: 0
      },
      
      // Ice age cycles
      iceAge: {
        active: false,
        cyclePhase: 'stable',
        temperatureShift: 0,
        adaptationBonus: 1.0,
        totalCycles: 0
      },
      
      // Crystal caverns
      crystalCaverns: {
        unlocked: false,
        depth: 0,
        excavationProgress: 0,
        cavernProduction: 0,
        uniqueCrystals: []
      },
      
      // Aurora events
      auroraEvents: {
        active: false,
        auroraType: 'northern',
        intensity: 5,
        planetWideBonus: 1.0,
        totalAuroraTime: 0
      },
      
      // Cold-specific candy types
      candyTypes: {
        iceCrystals: { discovered: false, count: 0 },
        frozenDelights: { discovered: false, count: 0 },
        auroraEssence: { discovered: false, count: 0 }
      }
    };
  }

  private startGameLoop(): void {
    interval(100) // 10 FPS for smooth temperature changes
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.temperatureMechanics || !this.planetState) return;
        
        this.updateTemperature();
        this.updateCrystallization();
        this.updateSpecialEvents();
        this.calculateModifiers();
      });
  }

  private updateTemperature(): void {
    if (!this.temperatureMechanics) return;
    
    const deltaTime = 0.1; // 100ms updates
    
    // Natural heat loss toward -10°C
    const targetTemp = -10;
    const tempDifference = targetTemp - this.temperatureMechanics.temperature;
    const heatLossAdjustment = tempDifference * this.temperatureMechanics.heatLoss * deltaTime;
    
    // Apply ice age temperature shift
    let iceAgeShift = 0;
    if (this.temperatureMechanics.iceAge.active) {
      iceAgeShift = this.temperatureMechanics.iceAge.temperatureShift * deltaTime;
    }
    
    // Update temperature
    this.temperatureMechanics.temperature += heatLossAdjustment + iceAgeShift;
    
    // Clamp temperature to valid range
    this.temperatureMechanics.temperature = Math.max(-50, Math.min(0, this.temperatureMechanics.temperature));
  }

  private updateCrystallization(): void {
    if (!this.temperatureMechanics || !this.planetState) return;
    
    const crystal = this.temperatureMechanics.crystallization;
    
    // Auto-crystallization when temperature threshold is met
    if (this.temperatureMechanics.temperature <= crystal.threshold && crystal.regularCandy > 0) {
      const deltaTime = 0.1;
      const crystallizeAmount = crystal.regularCandy * crystal.crystallizationRate * deltaTime;
      
      crystal.regularCandy -= crystallizeAmount;
      crystal.crystallizedCandy += crystallizeAmount;
      crystal.totalCrystallized += crystallizeAmount;
      
      // Update planet candy to include crystallized value
      this.planetState.candy = crystal.regularCandy + (crystal.crystallizedCandy * 10);
    }
    
    // Add new candy as regular candy
    const newCandy = this.planetState.productionPerSecond * 0.1; // 100ms delta
    crystal.regularCandy += newCandy;
  }

  private updateSpecialEvents(): void {
    if (!this.temperatureMechanics) return;
    
    // Random aurora events (1% chance per second, scaled to 100ms)
    if (!this.temperatureMechanics.auroraEvents.active && Math.random() < 0.0001) {
      this.triggerAuroraEvent();
    }
    
    // Random ice age events (0.1% chance per second, scaled to 100ms)
    if (!this.temperatureMechanics.iceAge.active && Math.random() < 0.00001) {
      this.triggerIceAgeEvent();
    }
    
    // Update aurora timing
    if (this.temperatureMechanics.auroraEvents.active && this.temperatureMechanics.auroraEvents.endTime) {
      if (Date.now() > this.temperatureMechanics.auroraEvents.endTime) {
        this.temperatureMechanics.auroraEvents.active = false;
        this.temperatureMechanics.auroraEvents.endTime = undefined;
        console.log('Aurora event ended');
      }
    }
    
    // Update ice age timing
    if (this.temperatureMechanics.iceAge.active && this.temperatureMechanics.iceAge.phaseEndTime) {
      if (Date.now() > this.temperatureMechanics.iceAge.phaseEndTime) {
        this.endIceAgePhase();
      }
    }
  }

  private calculateModifiers(): void {
    if (!this.temperatureMechanics) return;
    
    const temp = this.temperatureMechanics.temperature;
    const [optimalMin, optimalMax] = this.temperatureMechanics.optimalRange;
    
    // Production modifier: slower at colder temperatures
    const productionBase = Math.max(0.1, 1 - ((temp - (-10)) / 40) * 0.5);
    this.temperatureMechanics.temperatureModifier = productionBase;
    
    // Value modifier: higher value at colder temperatures
    const valueBase = 1 + Math.max(0, ((-10) - temp) / 40) * 2; // Up to 3x value at -50°C
    this.temperatureMechanics.valueModifier = valueBase;
    
    // Bonus for optimal range
    if (temp >= optimalMin && temp <= optimalMax) {
      this.temperatureMechanics.temperatureModifier *= 1.5;
      this.temperatureMechanics.valueModifier *= 1.3;
    }
    
    // Aurora bonus
    if (this.temperatureMechanics.auroraEvents.active) {
      this.temperatureMechanics.temperatureModifier *= this.temperatureMechanics.auroraEvents.planetWideBonus;
    }
    
    // Ice age adaptation bonus
    if (this.temperatureMechanics.iceAge.active) {
      this.temperatureMechanics.temperatureModifier *= this.temperatureMechanics.iceAge.adaptationBonus;
    }
  }

  async adjustTemperature(delta: number): Promise<void> {
    if (!this.canAdjustTemperature || !this.temperatureMechanics) return;
    
    const now = Date.now();
    if (now - this.lastTemperatureAdjustment < 1000) return; // 1 second cooldown
    
    const newTemp = this.temperatureMechanics.temperature + delta;
    this.temperatureMechanics.temperature = Math.max(-50, Math.min(0, newTemp));
    
    this.lastTemperatureAdjustment = now;
    this.canAdjustTemperature = false;
    
    // Re-enable after cooldown
    setTimeout(() => {
      this.canAdjustTemperature = true;
    }, 1000);
    
    console.log(`Temperature adjusted to ${this.temperatureMechanics.temperature.toFixed(1)}°C`);
  }

  async triggerCrystallization(): Promise<void> {
    if (!this.canCrystallize() || !this.temperatureMechanics) return;
    
    const crystal = this.temperatureMechanics.crystallization;
    const crystallizeAmount = Math.min(crystal.regularCandy, crystal.regularCandy * 0.5); // 50% manual crystallization
    
    crystal.regularCandy -= crystallizeAmount;
    crystal.crystallizedCandy += crystallizeAmount;
    crystal.totalCrystallized += crystallizeAmount;
    
    if (this.planetState) {
      this.planetState.candy = crystal.regularCandy + (crystal.crystallizedCandy * 10);
    }
    
    console.log(`Manually crystallized ${crystallizeAmount.toFixed(1)} candy`);
  }

  async excavate(): Promise<void> {
    if (!this.canExcavate() || !this.temperatureMechanics) return;
    
    const caverns = this.temperatureMechanics.crystalCaverns;
    caverns.excavationProgress += 10 + (caverns.depth * 2); // Faster at higher depths
    
    if (caverns.excavationProgress >= 100) {
      caverns.depth += 1;
      caverns.excavationProgress = 0;
      
      // Chance to discover unique crystals
      if (Math.random() < 0.3) {
        this.discoverUniqueCrystal();
      }
      
      console.log(`Excavated to depth ${caverns.depth}`);
    }
  }

  private discoverUniqueCrystal(): void {
    if (!this.temperatureMechanics) return;
    
    const crystalTypes = ['ice', 'frost', 'diamond'] as const;
    const rarities = ['common', 'rare', 'legendary'] as const;
    
    const type = crystalTypes[Math.floor(Math.random() * crystalTypes.length)];
    const rarity = rarities[Math.floor(Math.random() * rarities.length)];
    
    const baseValue = { common: 100, rare: 500, legendary: 2000 }[rarity];
    const value = baseValue * (1 + this.temperatureMechanics.crystalCaverns.depth);
    
    this.temperatureMechanics.crystalCaverns.uniqueCrystals.push({
      type,
      rarity,
      value,
      discoveredAt: Date.now()
    });
    
    console.log(`Discovered ${rarity} ${type} crystal worth ${value}`);
  }

  private triggerAuroraEvent(): void {
    if (!this.temperatureMechanics) return;
    
    const auroraTypes = ['northern', 'southern', 'cosmic'] as const;
    const aurora = this.temperatureMechanics.auroraEvents;
    
    aurora.active = true;
    aurora.auroraType = auroraTypes[Math.floor(Math.random() * auroraTypes.length)];
    aurora.intensity = Math.floor(Math.random() * 10) + 1;
    aurora.planetWideBonus = 1 + (aurora.intensity / 10); // 1.1x to 2x bonus
    aurora.endTime = Date.now() + (30000 + aurora.intensity * 10000); // 30s to 130s duration
    
    console.log(`Aurora ${aurora.auroraType} event started with intensity ${aurora.intensity}`);
  }

  private triggerIceAgeEvent(): void {
    if (!this.temperatureMechanics) return;
    
    const phases = ['warming', 'cooling'] as const;
    const iceAge = this.temperatureMechanics.iceAge;
    
    iceAge.active = true;
    iceAge.cyclePhase = phases[Math.floor(Math.random() * phases.length)];
    iceAge.temperatureShift = iceAge.cyclePhase === 'warming' ? 0.5 : -0.5;
    iceAge.adaptationBonus = 1.2; // 20% bonus for adaptation
    iceAge.phaseEndTime = Date.now() + 60000; // 1 minute phase
    iceAge.totalCycles += 1;
    
    console.log(`Ice age ${iceAge.cyclePhase} phase started`);
  }

  private endIceAgePhase(): void {
    if (!this.temperatureMechanics) return;
    
    const iceAge = this.temperatureMechanics.iceAge;
    
    if (iceAge.cyclePhase === 'warming') {
      iceAge.cyclePhase = 'cooling';
      iceAge.temperatureShift = -0.5;
      iceAge.phaseEndTime = Date.now() + 60000;
    } else if (iceAge.cyclePhase === 'cooling') {
      iceAge.active = false;
      iceAge.cyclePhase = 'stable';
      iceAge.temperatureShift = 0;
      iceAge.phaseEndTime = undefined;
    }
  }

  async clickPlanet(): Promise<void> {
    if (!this.planetState) return;
    
    const clickValue = this.planetState.clickPower * (this.temperatureMechanics?.valueModifier || 1);
    
    if (this.temperatureMechanics) {
      this.temperatureMechanics.crystallization.regularCandy += clickValue;
    }
    
    console.log(`Clicked for ${clickValue} candy`);
  }

  async navigateToSolarSystem(): Promise<void> {
    try {
      await this.router.navigate(['/solar-system']);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }

  // Utility methods
  formatNumber(num: number): string {
    if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return Math.floor(num).toString();
  }

  getTemperatureClass(): string {
    if (!this.temperatureMechanics) return 'normal';
    const temp = this.temperatureMechanics.temperature;
    if (temp <= -40) return 'extreme-cold';
    if (temp <= -30) return 'very-cold';
    if (temp <= -20) return 'cold';
    if (temp <= -10) return 'cool';
    return 'normal';
  }

  getTemperaturePercentage(): number {
    if (!this.temperatureMechanics) return 20;
    const temp = this.temperatureMechanics.temperature;
    return ((temp + 50) / 50) * 100; // -50 to 0 mapped to 0-100%
  }

  getOptimalRangeStart(): number {
    return (((-35) + 50) / 50) * 100; // -35°C position
  }

  getOptimalRangeWidth(): number {
    return (((-20) - (-35)) / 50) * 100; // -35°C to -20°C width
  }

  getTemperatureStatus(): string {
    if (!this.temperatureMechanics) return 'Unknown';
    const temp = this.temperatureMechanics.temperature;
    const [optimalMin, optimalMax] = this.temperatureMechanics.optimalRange;
    
    if (temp <= -45) return 'Extremely Cold - Risk of equipment failure';
    if (temp <= -35) return 'Very Cold - High crystallization rate';
    if (temp >= optimalMin && temp <= optimalMax) return 'Optimal Range - Maximum efficiency';
    if (temp <= -10) return 'Cold - Good preservation';
    if (temp >= -5) return 'Too Warm - Rapid melting';
    return 'Moderate Temperature';
  }

  canCrystallize(): boolean {
    return this.temperatureMechanics !== null && 
           this.temperatureMechanics.crystallization.regularCandy > 0;
  }

  isAutoCrystallizationActive(): boolean {
    return this.temperatureMechanics !== null &&
           this.temperatureMechanics.temperature <= this.temperatureMechanics.crystallization.threshold;
  }

  getCrystallizationProgress(): number {
    if (!this.temperatureMechanics) return 0;
    const crystal = this.temperatureMechanics.crystallization;
    if (crystal.regularCandy === 0) return 0;
    return Math.min(100, (crystal.crystallizationRate * 100));
  }

  hasActiveEvents(): boolean {
    return this.temperatureMechanics !== null &&
           (this.temperatureMechanics.iceAge.active || this.temperatureMechanics.auroraEvents.active);
  }

  canExcavate(): boolean {
    return this.temperatureMechanics !== null &&
           this.temperatureMechanics.crystalCaverns.unlocked &&
           this.temperatureMechanics.crystalCaverns.excavationProgress < 100;
  }

  getCrystalIcon(type: string): string {
    switch (type) {
      case 'ice': return '❄️';
      case 'frost': return '🔮';
      case 'diamond': return '💎';
      default: return '⭐';
    }
  }
}