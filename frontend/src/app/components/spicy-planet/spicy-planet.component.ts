/**
 * SpicyPlanetComponent - Spicy Planet with Heat Engine & Risk/Reward Mechanics
 * 
 * Features:
 * - Heat Engine System (0-100 heat level)
 * - Exponential production scaling (high risk, high reward)
 * - Overheat penalty system
 * - Volcanic activity events
 * - Heat redistribution zones
 * - Magma chamber exploration
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
import { SpicyPlanetMechanics } from '../../models/planet-mechanics.interface';

@Component({
  selector: 'app-spicy-planet',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spicy-planet" [class.loading]="isLoading" [class]="getRiskClass()">
      <!-- Navigation Header -->
      <div class="planet-header">
        <button class="back-button" (click)="navigateToSolarSystem()">
          ← Back to Solar System
        </button>
        <h1 class="planet-title">
          🌶️ Spicy Planet
          <span class="planet-subtitle">Heat Engine & Risk Management</span>
        </h1>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-state">
        <div class="loading-spinner">🔥</div>
        <p>Loading Spicy Planet...</p>
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
              <span class="stat-label">Spicy Candy</span>
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

            <div class="stat-item multiplier">
              <span class="stat-icon">🔥</span>
              <span class="stat-value">{{ (heatMechanics?.productionMultiplier || 1).toFixed(2) }}x</span>
              <span class="stat-label">Heat Bonus</span>
            </div>
          </div>
        </div>

        <!-- Heat Engine Section -->
        <div class="heat-engine-section">
          <h2 class="section-title">
            <span class="title-icon">🌡️</span>
            Heat Engine
            <span class="heat-level" [class]="getHeatLevelClass()">
              {{ (heatMechanics?.heatLevel || 0).toFixed(1) }}/100
            </span>
          </h2>
          
          <!-- Heat Gauge -->
          <div class="heat-gauge">
            <div class="gauge-track">
              <div class="gauge-fill" [style.width.%]="getHeatPercentage()"></div>
              <div class="danger-zones">
                <div class="zone safe" [style.width.%]="40"></div>
                <div class="zone moderate" [style.width.%]="30"></div>
                <div class="zone dangerous" [style.width.%]="20"></div>
                <div class="zone critical" [style.width.%]="10"></div>
              </div>
              <div class="gauge-indicator" [style.left.%]="getHeatPercentage()">
                <div class="indicator-dot" [class]="getHeatLevelClass()"></div>
              </div>
            </div>
            <div class="gauge-labels">
              <span class="min-heat">0</span>
              <span class="safe-limit">40</span>
              <span class="danger-limit">70</span>
              <span class="overheat-limit">100</span>
            </div>
          </div>

          <!-- Heat Controls -->
          <div class="heat-controls">
            <button 
              class="heat-button increase" 
              (click)="adjustHeat(10)"
              [disabled]="!canAdjustHeat() || isOverheating()">
              🔥 Increase Heat
            </button>
            
            <button 
              class="heat-button decrease" 
              (click)="adjustHeat(-10)"
              [disabled]="!canAdjustHeat() || (heatMechanics?.heatLevel || 0) <= 0">
              ❄️ Cool Down
            </button>
            
            <button 
              class="emergency-cool" 
              (click)="emergencyCooldown()"
              [disabled]="!canEmergencyCool()"
              *ngIf="(heatMechanics?.heatLevel || 0) > 80">
              🚨 Emergency Cool
            </button>
          </div>

          <!-- Risk Level Display -->
          <div class="risk-display">
            <div class="risk-indicator" [class]="heatMechanics?.riskLevel">
              <span class="risk-icon">{{ getRiskIcon() }}</span>
              <span class="risk-text">{{ (heatMechanics?.riskLevel || 'safe').toUpperCase() }}</span>
            </div>
            <div class="production-info">
              <span class="multiplier-text">Production Multiplier: {{ (heatMechanics?.productionMultiplier || 1).toFixed(2) }}x</span>
              <div class="heat-buildup" *ngIf="(heatMechanics?.heatBuildup || 0) > 0">
                Heat Buildup: +{{ (heatMechanics?.heatBuildup || 0).toFixed(1) }}/sec
              </div>
            </div>
          </div>
        </div>

        <!-- Overheat Status -->
        <div class="overheat-section" *ngIf="isOverheating()">
          <div class="overheat-panel">
            <div class="overheat-header">
              <span class="overheat-icon">🚨</span>
              <h3 class="overheat-title">OVERHEAT DETECTED!</h3>
              <span class="cooldown-timer">{{ getOverheatTimeRemaining() }}s</span>
            </div>
            <div class="overheat-effects">
              <p class="overheat-description">
                Heat engine is overheating! Production reduced to {{ ((heatMechanics?.overheat?.penaltyMultiplier || 0.5) * 100).toFixed(0) }}%
              </p>
              <div class="overheat-stats">
                <span class="penalty-stat">Candy Lost: {{ formatNumber(heatMechanics?.overheat?.candyLoss || 0) }}</span>
                <span class="overheat-count">Total Overheats: {{ heatMechanics?.overheat?.totalOverheats || 0 }}</span>
                <span class="heat-streak">Best Heat Streak: {{ heatMechanics?.overheat?.longestHeatStreak || 0 }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Click Area -->
        <div class="click-area">
          <div class="planet-display" (click)="clickPlanet()">
            <div class="planet-core" [class.overheating]="isOverheating()" [class]="getHeatLevelClass()">
              🌶️
            </div>
            <div class="heat-effects" *ngIf="(heatMechanics?.heatLevel || 0) > 30">
              <div class="flame-effect" *ngFor="let i of getFlameArray()">🔥</div>
            </div>
            <div class="volcanic-effect" *ngIf="heatMechanics?.volcanicActivity?.active">
              <div class="volcanic-particles">
                <div class="particle">💥</div>
                <div class="particle">⭐</div>
                <div class="particle">✨</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Special Events -->
        <div class="events-section" *ngIf="hasActiveEvents()">
          
          <!-- Volcanic Activity Event -->
          <div class="event-panel volcanic" *ngIf="heatMechanics?.volcanicActivity?.active">
            <div class="event-header">
              <span class="event-icon">🌋</span>
              <h3 class="event-title">{{ getVolcanicEventTitle() }}</h3>
              <span class="event-risk">Risk Level: {{ heatMechanics?.volcanicActivity?.riskLevel || 1 }}/10</span>
            </div>
            <div class="event-details">
              <p class="event-description">
                {{ getVolcanicEventDescription() }}
              </p>
              <button 
                class="emergency-shutdown" 
                *ngIf="heatMechanics?.volcanicActivity?.emergencyShutdown"
                (click)="triggerEmergencyShutdown()">
                🚨 Emergency Shutdown
              </button>
            </div>
          </div>
          
        </div>

        <!-- Heat Redistribution -->
        <div class="redistribution-section" *ngIf="heatMechanics?.heatRedistribution?.unlocked">
          <h2 class="section-title">
            <span class="title-icon">⚙️</span>
            Thermal Zones
            <span class="optimization-status" *ngIf="heatMechanics?.heatRedistribution?.optimalConfiguration">
              ✅ Optimized
            </span>
          </h2>
          
          <div class="thermal-zones">
            <div 
              class="thermal-zone" 
              *ngFor="let zone of (heatMechanics?.heatRedistribution?.thermalZones || [])"
              [class.connected]="zone.connected">
              <div class="zone-header">
                <span class="zone-id">Zone {{ zone.id.toUpperCase() }}</span>
                <span class="zone-efficiency">{{ (zone.efficiency * 100).toFixed(0) }}%</span>
              </div>
              <div class="zone-heat">
                <div class="heat-bar">
                  <div class="heat-fill" [style.width.%]="zone.heatLevel"></div>
                </div>
                <span class="heat-value">{{ zone.heatLevel.toFixed(1) }}</span>
              </div>
              <button 
                class="zone-toggle" 
                (click)="toggleZoneConnection(zone.id)"
                [class.active]="zone.connected">
                {{ zone.connected ? 'Connected' : 'Disconnected' }}
              </button>
            </div>
          </div>

          <div class="redistribution-controls">
            <div class="redistribution-rate">
              Transfer Rate: {{ (heatMechanics?.heatRedistribution?.redistributionRate || 0).toFixed(1) }}/sec
            </div>
            <button class="optimize-zones" (click)="optimizeThermalZones()">
              ⚙️ Auto-Optimize Zones
            </button>
          </div>
        </div>

        <!-- Magma Chambers -->
        <div class="magma-chambers-section" *ngIf="heatMechanics?.magmaChambers?.unlocked">
          <h2 class="section-title">
            <span class="title-icon">🌋</span>
            Magma Chambers
            <span class="total-production">
              Total: {{ formatNumber(heatMechanics?.magmaChambers?.totalMagmaProduction || 0) }}/sec
            </span>
          </h2>
          
          <div class="chambers-grid">
            <div 
              class="magma-chamber" 
              *ngFor="let chamber of (heatMechanics?.magmaChambers?.chambers || []); let i = index"
              [class]="getChamberClass(chamber)">
              <div class="chamber-info">
                <div class="chamber-depth">
                  <span class="depth-icon">⬇️</span>
                  <span class="depth-value">{{ chamber.depth }}km</span>
                </div>
                <div class="chamber-pressure">
                  <span class="pressure-icon">💨</span>
                  <span class="pressure-value">{{ chamber.pressure.toFixed(1) }} atm</span>
                </div>
                <div class="chamber-capacity">
                  <span class="capacity-icon">🔥</span>
                  <span class="capacity-value">{{ chamber.capacity.toFixed(0) }} heat</span>
                </div>
              </div>
              <div class="chamber-production">
                <span class="production-value">{{ formatNumber(chamber.productionBonus) }}/sec</span>
                <span class="production-label">Production Bonus</span>
              </div>
              <button 
                class="drill-deeper" 
                (click)="drillDeeper(i)"
                [disabled]="!canDrillDeeper(chamber)">
                ⛏️ Drill Deeper
              </button>
            </div>
          </div>
        </div>

        <!-- Heat Export -->
        <div class="heat-export-section" *ngIf="(heatMechanics?.heatExport?.exportRate || 0) > 0">
          <h2 class="section-title">
            <span class="title-icon">📤</span>
            Heat Export System
          </h2>
          
          <div class="export-stats">
            <div class="export-stat">
              <span class="label">Export Rate:</span>
              <span class="value">{{ (heatMechanics?.heatExport?.exportRate || 0).toFixed(1) }} heat/sec</span>
            </div>
            <div class="export-stat">
              <span class="label">Efficiency:</span>
              <span class="value">{{ ((heatMechanics?.heatExport?.efficiency || 0) * 100).toFixed(0) }}%</span>
            </div>
            <div class="export-stat">
              <span class="label">Total Exported:</span>
              <span class="value">{{ formatNumber(heatMechanics?.heatExport?.totalHeatExported || 0) }}</span>
            </div>
            <div class="export-stat">
              <span class="label">Recipient:</span>
              <span class="value">{{ (heatMechanics?.heatExport?.recipientPlanet || 'None').toString().replace('cold', '🧊 Cold Planet') }}</span>
            </div>
          </div>

          <button class="configure-export" (click)="configureHeatExport()">
            ⚙️ Configure Export
          </button>
        </div>

      </div>
    </div>
  `,
  styleUrls: ['./spicy-planet.component.css']
})
export class SpicyPlanetComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  gameState: EnhancedGameState | null = null;
  planetState: PlanetState | null = null;
  heatMechanics: SpicyPlanetMechanics | null = null;
  
  isLoading = true;
  error: string | null = null;
  
  // UI state
  lastHeatAdjustment = 0;
  
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

      // Check if Spicy Planet is unlocked
      if (!this.gameState.planets['spicy']?.unlocked) {
        this.error = 'Spicy Planet is locked. Unlock by reaching 100,000 total candy, completing network synergy requirements, and establishing 3 trade routes.';
        this.isLoading = false;
        return;
      }

      // Switch to Spicy Planet
      const switchSuccess = await this.planetSystemService.switchToPlanet('spicy');
      if (!switchSuccess) {
        throw new Error('Failed to switch to Spicy Planet');
      }

      // Get updated game state
      this.gameState = this.planetSystemService.getCurrentGameState();
      if (!this.gameState) {
        throw new Error('Game state became null after planet switch');
      }

      this.planetState = this.gameState.planets['spicy'];
      
      // Initialize or get heat mechanics
      if (!this.planetState.specialMechanics || !this.planetState.specialMechanics.spicyMechanics) {
        this.heatMechanics = this.initializeSpicyMechanics();
        this.planetState.specialMechanics = { spicyMechanics: this.heatMechanics };
      } else {
        this.heatMechanics = this.planetState.specialMechanics.spicyMechanics as SpicyPlanetMechanics;
      }
      
      this.isLoading = false;
      console.log('Spicy Planet loaded successfully');
      
    } catch (error) {
      console.error('Error loading Spicy Planet:', error);
      this.error = error instanceof Error ? error.message : 'Unknown error occurred';
      this.isLoading = false;
    }
  }

  private initializeSpicyMechanics(): SpicyPlanetMechanics {
    return {
      // Heat engine core system
      heatLevel: 20, // Start with some heat
      heatBuildup: 1.0,
      coolingRate: 0.5,
      overheatThreshold: 100,
      
      // Production scaling
      productionMultiplier: 1.0,
      riskLevel: 'safe',
      
      // Overheat system
      overheat: {
        active: false,
        penaltyMultiplier: 0.5,
        candyLoss: 0,
        totalOverheats: 0,
        longestHeatStreak: 0
      },
      
      // Heat redistribution
      heatRedistribution: {
        unlocked: false,
        thermalZones: [],
        redistributionRate: 0,
        optimalConfiguration: false
      },
      
      // Volcanic activity
      volcanicActivity: {
        active: false,
        activityType: 'thermal_vent',
        riskLevel: 1,
        emergencyShutdown: false,
        totalVolcanicEvents: 0
      },
      
      // Magma chambers
      magmaChambers: {
        unlocked: false,
        chambers: [],
        totalMagmaProduction: 0
      },
      
      // Heat export system
      heatExport: {
        exportRate: 0,
        efficiency: 0.8,
        totalHeatExported: 0,
        recipientPlanet: null
      },
      
      // Spicy candy types
      candyTypes: {
        firePeppers: { discovered: false, count: 0 },
        moltenCores: { discovered: false, count: 0 },
        thermalCrystals: { discovered: false, count: 0 }
      }
    };
  }

  private startGameLoop(): void {
    interval(100) // 10 FPS for smooth heat changes
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.heatMechanics || !this.planetState) return;
        
        this.updateHeatEngine();
        this.updateVolcanicActivity();
        this.updateHeatRedistribution();
        this.calculateProductionMultiplier();
        this.checkOverheatConditions();
      });
  }

  private updateHeatEngine(): void {
    if (!this.heatMechanics) return;
    
    const deltaTime = 0.1; // 100ms updates
    
    // Natural cooling unless overheating
    if (!this.heatMechanics.overheat.active) {
      this.heatMechanics.heatLevel -= this.heatMechanics.coolingRate * deltaTime;
      
      // Heat buildup from production
      if (this.planetState && this.planetState.productionPerSecond > 0) {
        this.heatMechanics.heatLevel += this.heatMechanics.heatBuildup * deltaTime;
      }
    }
    
    // Clamp heat level
    this.heatMechanics.heatLevel = Math.max(0, Math.min(this.heatMechanics.overheatThreshold, this.heatMechanics.heatLevel));
    
    // Update risk level
    this.updateRiskLevel();
  }

  private updateRiskLevel(): void {
    if (!this.heatMechanics) return;
    
    const heatPercentage = this.heatMechanics.heatLevel / this.heatMechanics.overheatThreshold;
    
    if (heatPercentage >= 0.9) {
      this.heatMechanics.riskLevel = 'critical';
    } else if (heatPercentage >= 0.7) {
      this.heatMechanics.riskLevel = 'dangerous';
    } else if (heatPercentage >= 0.4) {
      this.heatMechanics.riskLevel = 'moderate';
    } else {
      this.heatMechanics.riskLevel = 'safe';
    }
  }

  private calculateProductionMultiplier(): void {
    if (!this.heatMechanics) return;
    
    // Exponential scaling: 1.05^heatLevel
    const baseMultiplier = Math.pow(1.05, this.heatMechanics.heatLevel);
    
    // Apply overheat penalty
    if (this.heatMechanics.overheat.active) {
      this.heatMechanics.productionMultiplier = baseMultiplier * this.heatMechanics.overheat.penaltyMultiplier;
    } else {
      this.heatMechanics.productionMultiplier = baseMultiplier;
    }
  }

  private updateVolcanicActivity(): void {
    if (!this.heatMechanics) return;
    
    // Random volcanic events (0.1% chance per second, scaled to 100ms)
    if (!this.heatMechanics.volcanicActivity.active && Math.random() < 0.00001) {
      this.triggerVolcanicEvent();
    }
    
    // End volcanic events
    if (this.heatMechanics.volcanicActivity.active && this.heatMechanics.volcanicActivity.endTime) {
      if (Date.now() > this.heatMechanics.volcanicActivity.endTime) {
        this.endVolcanicEvent();
      }
    }
  }

  private updateHeatRedistribution(): void {
    if (!this.heatMechanics?.heatRedistribution?.unlocked) return;
    
    const redistribution = this.heatMechanics.heatRedistribution;
    const deltaTime = 0.1;
    
    // Redistribute heat between connected zones
    if (redistribution.redistributionRate > 0) {
      const connectedZones = redistribution.thermalZones.filter(z => z.connected);
      if (connectedZones.length > 1) {
        const avgHeat = connectedZones.reduce((sum, z) => sum + z.heatLevel, 0) / connectedZones.length;
        
        connectedZones.forEach(zone => {
          const heatDiff = avgHeat - zone.heatLevel;
          zone.heatLevel += heatDiff * redistribution.redistributionRate * deltaTime;
          zone.heatLevel = Math.max(0, Math.min(100, zone.heatLevel));
        });
      }
    }
    
    // Check for optimal configuration
    this.checkOptimalConfiguration();
  }

  private checkOptimalConfiguration(): void {
    if (!this.heatMechanics?.heatRedistribution?.unlocked) return;
    
    const zones = this.heatMechanics.heatRedistribution.thermalZones;
    const connectedZones = zones.filter(z => z.connected);
    
    if (connectedZones.length < 2) {
      this.heatMechanics.heatRedistribution.optimalConfiguration = false;
      return;
    }
    
    // Check if heat levels are balanced (within 10% of each other)
    const minHeat = Math.min(...connectedZones.map(z => z.heatLevel));
    const maxHeat = Math.max(...connectedZones.map(z => z.heatLevel));
    const variance = (maxHeat - minHeat) / Math.max(maxHeat, 1);
    
    this.heatMechanics.heatRedistribution.optimalConfiguration = variance < 0.1;
  }

  private checkOverheatConditions(): void {
    if (!this.heatMechanics) return;
    
    // Check for overheat
    if (this.heatMechanics.heatLevel >= this.heatMechanics.overheatThreshold && !this.heatMechanics.overheat.active) {
      this.triggerOverheat();
    }
    
    // Check for overheat recovery
    if (this.heatMechanics.overheat.active && this.heatMechanics.overheat.cooldownEndTime) {
      if (Date.now() > this.heatMechanics.overheat.cooldownEndTime) {
        this.recoverFromOverheat();
      }
    }
  }

  private triggerOverheat(): void {
    if (!this.heatMechanics || !this.planetState) return;
    
    console.log('🚨 OVERHEAT TRIGGERED!');
    
    // Calculate candy loss (50% of current candy)
    const candyLoss = this.planetState.candy * 0.5;
    this.planetState.candy -= candyLoss;
    
    // Update overheat statistics
    this.heatMechanics.overheat.active = true;
    this.heatMechanics.overheat.candyLoss = candyLoss;
    this.heatMechanics.overheat.totalOverheats += 1;
    this.heatMechanics.overheat.cooldownEndTime = Date.now() + 60000; // 60 second cooldown
    
    // Record heat streak
    if (this.heatMechanics.heatLevel > this.heatMechanics.overheat.longestHeatStreak) {
      this.heatMechanics.overheat.longestHeatStreak = this.heatMechanics.heatLevel;
    }
    
    // Force cool the engine
    this.heatMechanics.heatLevel = 0;
  }

  private recoverFromOverheat(): void {
    if (!this.heatMechanics) return;
    
    console.log('✅ Overheat recovery complete');
    
    this.heatMechanics.overheat.active = false;
    this.heatMechanics.overheat.cooldownEndTime = undefined;
  }

  private triggerVolcanicEvent(): void {
    if (!this.heatMechanics) return;
    
    const activityTypes = ['eruption', 'thermal_vent', 'lava_flow'] as const;
    const volcanic = this.heatMechanics.volcanicActivity;
    
    volcanic.active = true;
    volcanic.activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    volcanic.riskLevel = Math.floor(Math.random() * 10) + 1;
    volcanic.endTime = Date.now() + (30000 + volcanic.riskLevel * 5000); // 30s to 80s duration
    volcanic.totalVolcanicEvents += 1;
    
    // Emergency shutdown available for high-risk events
    volcanic.emergencyShutdown = volcanic.riskLevel >= 7;
    
    console.log(`🌋 Volcanic ${volcanic.activityType} event started (risk: ${volcanic.riskLevel})`);
  }

  private endVolcanicEvent(): void {
    if (!this.heatMechanics) return;
    
    this.heatMechanics.volcanicActivity.active = false;
    this.heatMechanics.volcanicActivity.endTime = undefined;
    this.heatMechanics.volcanicActivity.emergencyShutdown = false;
    
    console.log('🌋 Volcanic event ended');
  }

  async adjustHeat(delta: number): Promise<void> {
    if (!this.canAdjustHeat() || !this.heatMechanics) return;
    
    const now = Date.now();
    if (now - this.lastHeatAdjustment < 500) return; // 0.5 second cooldown
    
    const newHeat = Math.max(0, Math.min(this.heatMechanics.overheatThreshold, this.heatMechanics.heatLevel + delta));
    this.heatMechanics.heatLevel = newHeat;
    
    this.lastHeatAdjustment = now;
    
    console.log(`Heat adjusted to ${newHeat.toFixed(1)}`);
  }

  async emergencyCooldown(): Promise<void> {
    if (!this.canEmergencyCool() || !this.heatMechanics) return;
    
    this.heatMechanics.heatLevel = Math.max(0, this.heatMechanics.heatLevel * 0.3); // 70% reduction
    console.log('🚨 Emergency cooldown activated');
  }

  async triggerEmergencyShutdown(): Promise<void> {
    if (!this.heatMechanics?.volcanicActivity?.emergencyShutdown) return;
    
    this.heatMechanics.heatLevel = 0;
    this.endVolcanicEvent();
    console.log('🚨 Emergency shutdown activated');
  }

  async toggleZoneConnection(zoneId: string): Promise<void> {
    if (!this.heatMechanics?.heatRedistribution?.unlocked) return;
    
    const zone = this.heatMechanics.heatRedistribution.thermalZones.find(z => z.id === zoneId);
    if (zone) {
      zone.connected = !zone.connected;
      console.log(`Zone ${zoneId} ${zone.connected ? 'connected' : 'disconnected'}`);
    }
  }

  async optimizeThermalZones(): Promise<void> {
    if (!this.heatMechanics?.heatRedistribution?.unlocked) return;
    
    const zones = this.heatMechanics.heatRedistribution.thermalZones;
    const totalHeat = zones.reduce((sum, z) => sum + z.heatLevel, 0);
    const avgHeat = totalHeat / zones.length;
    
    // Balance all zones to average heat
    zones.forEach(zone => {
      zone.heatLevel = avgHeat;
      zone.connected = true; // Connect all zones
    });
    
    this.heatMechanics.heatRedistribution.optimalConfiguration = true;
    console.log('⚙️ Thermal zones optimized');
  }

  async drillDeeper(chamberIndex: number): Promise<void> {
    if (!this.heatMechanics?.magmaChambers?.unlocked) return;
    
    const chamber = this.heatMechanics.magmaChambers.chambers[chamberIndex];
    if (!chamber || !this.canDrillDeeper(chamber)) return;
    
    chamber.depth += 0.5; // 500m deeper
    chamber.pressure += 0.2; // Increased pressure
    chamber.capacity += 10; // Higher capacity
    chamber.productionBonus *= 1.2; // 20% more production
    
    console.log(`⛏️ Drilled chamber ${chamberIndex} to ${chamber.depth}km depth`);
  }

  async configureHeatExport(): Promise<void> {
    if (!this.heatMechanics?.heatExport) return;
    
    // Simple toggle for now - in full implementation this would open a config dialog
    if (this.heatMechanics.heatExport.recipientPlanet === 'cold') {
      this.heatMechanics.heatExport.recipientPlanet = null;
      this.heatMechanics.heatExport.exportRate = 0;
    } else {
      this.heatMechanics.heatExport.recipientPlanet = 'cold';
      this.heatMechanics.heatExport.exportRate = this.heatMechanics.heatLevel * 0.1;
    }
    
    console.log('📤 Heat export configuration updated');
  }

  async clickPlanet(): Promise<void> {
    if (!this.planetState || !this.heatMechanics) return;
    
    const baseClickValue = this.planetState.clickPower;
    const clickValue = baseClickValue * this.heatMechanics.productionMultiplier;
    
    this.planetState.candy += clickValue;
    
    // Clicking increases heat slightly
    this.heatMechanics.heatLevel += 0.5;
    
    console.log(`Clicked for ${clickValue.toFixed(1)} candy (${this.heatMechanics.productionMultiplier.toFixed(2)}x multiplier)`);
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

  getRiskClass(): string {
    if (!this.heatMechanics) return 'safe';
    return `risk-${this.heatMechanics.riskLevel}`;
  }

  getHeatLevelClass(): string {
    if (!this.heatMechanics) return 'safe';
    return this.heatMechanics.riskLevel;
  }

  getHeatPercentage(): number {
    if (!this.heatMechanics) return 0;
    return (this.heatMechanics.heatLevel / this.heatMechanics.overheatThreshold) * 100;
  }

  getRiskIcon(): string {
    if (!this.heatMechanics) return '✅';
    switch (this.heatMechanics.riskLevel) {
      case 'safe': return '✅';
      case 'moderate': return '⚠️';
      case 'dangerous': return '🔥';
      case 'critical': return '🚨';
      default: return '✅';
    }
  }

  canAdjustHeat(): boolean {
    return this.heatMechanics !== null && !this.isOverheating();
  }

  canEmergencyCool(): boolean {
    return this.heatMechanics !== null && 
           this.heatMechanics.heatLevel > 80 && 
           !this.isOverheating();
  }

  isOverheating(): boolean {
    return this.heatMechanics?.overheat?.active || false;
  }

  getOverheatTimeRemaining(): number {
    if (!this.heatMechanics?.overheat?.cooldownEndTime) return 0;
    return Math.max(0, Math.ceil((this.heatMechanics.overheat.cooldownEndTime - Date.now()) / 1000));
  }

  hasActiveEvents(): boolean {
    return this.heatMechanics?.volcanicActivity?.active || false;
  }

  getVolcanicEventTitle(): string {
    if (!this.heatMechanics?.volcanicActivity?.activityType) return 'Volcanic Activity';
    
    switch (this.heatMechanics.volcanicActivity.activityType) {
      case 'eruption': return 'Volcanic Eruption';
      case 'thermal_vent': return 'Thermal Vent';
      case 'lava_flow': return 'Lava Flow';
      default: return 'Volcanic Activity';
    }
  }

  getVolcanicEventDescription(): string {
    if (!this.heatMechanics?.volcanicActivity?.activityType) return 'Unknown volcanic activity detected.';
    
    switch (this.heatMechanics.volcanicActivity.activityType) {
      case 'eruption': return 'A massive volcanic eruption is occurring! Extreme heat and production bonuses, but high overheat risk.';
      case 'thermal_vent': return 'Thermal vents are releasing superheated gas. Moderate production bonus with manageable risk.';
      case 'lava_flow': return 'Lava flows are increasing planetary temperature. Steady production bonus but watch for heat buildup.';
      default: return 'Volcanic activity is affecting planetary systems.';
    }
  }

  getFlameArray(): number[] {
    if (!this.heatMechanics) return [];
    const flameCount = Math.min(8, Math.floor(this.heatMechanics.heatLevel / 10));
    return new Array(flameCount).fill(0).map((_, i) => i);
  }

  getChamberClass(chamber: any): string {
    if (chamber.pressure > 5) return 'high-pressure';
    if (chamber.pressure > 3) return 'medium-pressure';
    return 'low-pressure';
  }

  canDrillDeeper(chamber: any): boolean {
    return chamber.depth < 20 && chamber.pressure < 8; // Max 20km depth, 8 atm pressure
  }
}