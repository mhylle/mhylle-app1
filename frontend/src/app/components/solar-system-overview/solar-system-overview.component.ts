/**
 * SolarSystemOverviewComponent - Main Navigation Hub
 * 
 * Provides the main interface for:
 * - Viewing all 6 planets in the solar system
 * - Planet selection and navigation
 * - Displaying planet status and progress
 * - Mobile-responsive card-based navigation
 * - Network synergy visualization
 * - "Collect All" and "Auto-Pilot" global actions
 */

import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Import services and models
import { PlanetSystemService } from '../../services/planet-system.service';
import { 
  PlanetType, 
  EnhancedGameState, 
  PlanetState,
  NetworkSynergy 
} from '../../models/planet-system.interface';

interface PlanetDisplayInfo {
  id: PlanetType;
  name: string;
  emoji: string;
  color: string;
  description: string;
  unlocked: boolean;
  candy: number;
  productionPerSecond: number;
  statusText: string;
  progressToUnlock?: number;
  specialStatus?: string;
}

@Component({
  selector: 'app-solar-system-overview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="solar-system-container" [class.mobile-layout]="isMobileLayout" [class.loading]="isLoading">
      
      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-state">
        <div class="loading-spinner">🌌</div>
        <p class="loading-text">Loading Solar System...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error && !isLoading" class="error-state">
        <div class="error-icon">⚠️</div>
        <p class="error-message">{{ error }}</p>
        <button class="retry-button" (click)="retryLoadData()">Retry</button>
      </div>

      <!-- Main Content (only show when not loading and no error) -->
      <div *ngIf="!isLoading && !error">
        <!-- Header with global stats -->
      <div class="cosmic-header">
        <div class="global-stats">
          <div class="stat-item">
            <span class="stat-icon">🍬</span>
            <span class="stat-value">{{formatNumber(totalCandy)}}</span>
            <span class="stat-label">Total Candy</span>
          </div>
          
          <div class="stat-item">
            <span class="stat-icon">⚡</span>
            <span class="stat-value">{{formatNumber(totalProduction)}}/sec</span>
            <span class="stat-label">Total Production</span>
          </div>
          
          <div class="stat-item" *ngIf="networkSynergy && networkSynergy.activePlanets.length > 1">
            <span class="stat-icon">🌐</span>
            <span class="stat-value">{{(networkSynergy.synergyLevel * 100 - 100).toFixed(0)}}%</span>
            <span class="stat-label">Network Bonus</span>
          </div>
          
          <div class="stat-item">
            <span class="stat-icon">⭐</span>
            <span class="stat-value">Lv.{{solarSystemLevel}}</span>
            <span class="stat-label">Cosmic Level</span>
          </div>
        </div>

        <!-- Global action buttons -->
        <div class="global-actions">
          <button 
            class="action-button collect-all"
            (click)="collectAllCandy()"
            [disabled]="!canCollectAll">
            <span class="button-icon">🌟</span>
            Collect All
          </button>
          
          <button 
            class="action-button auto-pilot"
            (click)="toggleAutoPilot()"
            [class.active]="autoPilotEnabled">
            <span class="button-icon">🤖</span>
            Auto-Pilot
          </button>
        </div>
      </div>

      <!-- Main planet display area -->
      <div class="planets-container">
        <!-- Desktop/Tablet: Grid layout -->
        <div class="planets-grid" *ngIf="!isMobileLayout">
          <div 
            *ngFor="let planet of planets" 
            class="planet-card"
            [class.unlocked]="planet.unlocked"
            [class.locked]="!planet.unlocked"
            [class.current]="currentPlanet === planet.id"
            [style.--planet-color]="planet.color"
            (click)="selectPlanet(planet.id)">
            
            <!-- Planet visual -->
            <div class="planet-visual">
              <div class="planet-icon">{{planet.emoji}}</div>
              <div class="planet-glow" *ngIf="planet.unlocked"></div>
              <div class="production-ring" *ngIf="planet.unlocked && planet.productionPerSecond > 0"></div>
            </div>
            
            <!-- Planet info -->
            <div class="planet-info">
              <h3 class="planet-name">{{planet.name}}</h3>
              <div class="planet-stats" *ngIf="planet.unlocked">
                <div class="stat">🍬 {{formatNumber(planet.candy)}}</div>
                <div class="stat">⚡ {{formatNumber(planet.productionPerSecond)}}/sec</div>
                <div class="status-indicator" [innerHTML]="planet.statusText"></div>
              </div>
              
              <!-- Unlock progress for locked planets -->
              <div class="unlock-progress" *ngIf="!planet.unlocked">
                <div class="unlock-description">{{planet.description}}</div>
                <div class="progress-bar" *ngIf="planet.progressToUnlock !== undefined">
                  <div class="progress-fill" [style.width.%]="planet.progressToUnlock"></div>
                </div>
                <div class="unlock-requirement">{{planet.statusText}}</div>
              </div>
            </div>

            <!-- Alert indicator -->
            <div class="alert-indicator" *ngIf="planet.specialStatus" [title]="planet.specialStatus">
              ⚠️
            </div>
          </div>
        </div>

        <!-- Mobile: Horizontal scrolling cards -->
        <div class="planets-mobile-scroll" *ngIf="isMobileLayout">
          <div class="planets-cards-container"
               #mobileContainer
               (touchstart)="onTouchStart($event)"
               (touchmove)="onTouchMove($event)"
               (touchend)="onTouchEnd($event)">
            
            <div 
              *ngFor="let planet of planets; let i = index"
              class="planet-mobile-card"
              [class.active]="i === activeMobileCard"
              [class.unlocked]="planet.unlocked"
              [style.--planet-color]="planet.color"
              (click)="selectPlanet(planet.id)">
              
              <div class="mobile-planet-visual">
                <div class="mobile-planet-icon">{{planet.emoji}}</div>
                <div class="mobile-planet-name">{{planet.name}}</div>
              </div>
              
              <div class="mobile-planet-stats" *ngIf="planet.unlocked">
                <div class="mobile-stat">{{formatNumber(planet.candy)}} 🍬</div>
                <div class="mobile-stat">{{formatNumber(planet.productionPerSecond)}}/sec ⚡</div>
              </div>
              
              <div class="mobile-unlock-info" *ngIf="!planet.unlocked">
                <div class="mobile-unlock-text">{{planet.statusText}}</div>
                <div class="mobile-progress" *ngIf="planet.progressToUnlock !== undefined">
                  {{planet.progressToUnlock.toFixed(0)}}% Complete
                </div>
              </div>
            </div>
          </div>
          
          <!-- Mobile navigation dots -->
          <div class="mobile-nav-dots">
            <div 
              *ngFor="let planet of planets; let i = index"
              class="nav-dot"
              [class.active]="i === activeMobileCard"
              [class.unlocked]="planet.unlocked"
              (click)="scrollToCard(i)">
            </div>
          </div>
        </div>
      </div>

      <!-- Network synergy visualization -->
      <div class="network-synergy-display" *ngIf="networkSynergy && networkSynergy.activePlanets.length > 1">
        <div class="synergy-header">
          <span class="synergy-icon">🌐</span>
          <span class="synergy-title">Network Synergy Active</span>
          <span class="synergy-bonus">+{{(networkSynergy.synergyLevel * 100 - 100).toFixed(0)}}% Bonus</span>
        </div>
        
        <div class="synergy-connections">
          <div 
            *ngFor="let planetId of networkSynergy.activePlanets"
            class="synergy-node"
            [style.--planet-color]="getPlanetColor(planetId)">
            {{getPlanetEmoji(planetId)}}
          </div>
        </div>
      </div>

      <!-- Quick actions footer (mobile) -->
      <div class="mobile-quick-actions" *ngIf="isMobileLayout">
        <button 
          class="quick-action"
          (click)="collectAllCandy()"
          [disabled]="!canCollectAll">
          🌟 Collect All
        </button>
        <button 
          class="quick-action"
          (click)="toggleAutoPilot()"
          [class.active]="autoPilotEnabled">
          🤖 Auto-Pilot
        </button>
      </div>
      
      </div> <!-- End main content -->
    </div>
  `,
  styleUrls: ['./solar-system-overview.component.css']
})
export class SolarSystemOverviewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Component state
  gameState: EnhancedGameState | null = null;
  currentPlanet: PlanetType = 'sweet';
  planets: PlanetDisplayInfo[] = [];
  networkSynergy: NetworkSynergy | null = null;
  
  // UI state
  isLoading = true;
  error: string | null = null;
  
  // Computed values
  totalCandy = 0;
  totalProduction = 0;
  solarSystemLevel = 1;
  canCollectAll = false;
  autoPilotEnabled = false;
  
  // Mobile layout handling
  isMobileLayout = false;
  activeMobileCard = 0;
  
  // Touch handling for mobile swipe
  private touchStartX = 0;
  private touchStartTime = 0;
  private isDragging = false;
  
  constructor(
    private planetSystemService: PlanetSystemService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkMobileLayout();
    this.subscribeToGameState();
    this.subscribeToCurrentPlanet();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize', [])
  onResize(): void {
    this.checkMobileLayout();
  }

  /**
   * Subscribe to game state changes
   */
  private subscribeToGameState(): void {
    this.planetSystemService.gameState
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (gameState) => {
          this.gameState = gameState;
          if (gameState) {
            this.updateDisplayData(gameState);
            this.isLoading = false;
            this.error = null;
          } else if (!this.isLoading) {
            // Only set error if we've finished initial loading
            this.error = 'No game data available';
          }
        },
        error: (err) => {
          console.error('Error loading game state:', err);
          this.error = 'Failed to load game data. Please refresh the page.';
          this.isLoading = false;
        }
      });
  }

  /**
   * Subscribe to current planet changes
   */
  private subscribeToCurrentPlanet(): void {
    this.planetSystemService.currentPlanet
      .pipe(takeUntil(this.destroy$))
      .subscribe(planetId => {
        this.currentPlanet = planetId;
        this.updateActiveMobileCard();
      });
  }

  /**
   * Update all display data from game state
   */
  private updateDisplayData(gameState: EnhancedGameState): void {
    // Update computed totals
    this.totalCandy = Object.values(gameState.planets)
      .reduce((sum, planet) => sum + planet.candy, 0);
    
    this.totalProduction = Object.values(gameState.planets)
      .filter(planet => planet.unlocked)
      .reduce((sum, planet) => sum + planet.productionPerSecond, 0);
    
    this.solarSystemLevel = gameState.solarSystemLevel;
    this.networkSynergy = gameState.networkSynergy;
    
    // Update planet display info
    this.planets = this.createPlanetDisplayInfo(gameState);
    
    // Update action availability
    this.canCollectAll = this.planets.some(p => p.unlocked && p.candy > 0);
    this.autoPilotEnabled = gameState.preferences.autoSwitchPlanets;
  }

  /**
   * Create display information for all planets
   */
  private createPlanetDisplayInfo(gameState: EnhancedGameState): PlanetDisplayInfo[] {
    const planetConfigs = [
      { id: 'sweet' as PlanetType, name: 'Sweet Planet', emoji: '🍯', color: '#FFD700', description: 'Foundation planet with sweetness accumulation' },
      { id: 'sour' as PlanetType, name: 'Sour Planet', emoji: '🍋', color: '#32CD32', description: 'pH balance management and fermentation' },
      { id: 'cold' as PlanetType, name: 'Cold Planet', emoji: '🧊', color: '#87CEEB', description: 'Temperature management and crystallization' },
      { id: 'spicy' as PlanetType, name: 'Spicy Planet', emoji: '🌶️', color: '#FF4500', description: 'Heat engine with risk/reward mechanics' },
      { id: 'bitter' as PlanetType, name: 'Bitter Planet', emoji: '🍫', color: '#8B4513', description: 'Complexity scaling and sophistication' },
      { id: 'fizzy' as PlanetType, name: 'Fizzy Planet', emoji: '🥤', color: '#FF69B4', description: 'Pressure systems and celebration cascades' }
    ];

    return planetConfigs.map(config => {
      const planetState = gameState.planets[config.id];
      const unlockProgress = gameState.planetUnlockProgress[config.id];
      
      return {
        id: config.id,
        name: config.name,
        emoji: config.emoji,
        color: config.color,
        description: config.description,
        unlocked: planetState.unlocked,
        candy: planetState.candy,
        productionPerSecond: planetState.productionPerSecond,
        statusText: this.generateStatusText(planetState, unlockProgress),
        progressToUnlock: this.calculateUnlockProgress(config.id),
        specialStatus: this.generateSpecialStatus(planetState)
      };
    });
  }

  /**
   * Generate status text for a planet
   */
  private generateStatusText(planetState: PlanetState, unlockProgress?: any): string {
    const statusInfo = this.planetSystemService.getPlanetSpecificStatus(planetState.id);
    return statusInfo.status;
  }


  /**
   * Generate special status alerts for planets
   */
  private generateSpecialStatus(planetState: PlanetState): string | undefined {
    if (!planetState.unlocked) return undefined;
    const statusInfo = this.planetSystemService.getPlanetSpecificStatus(planetState.id);
    return statusInfo.specialAlert;
  }

  /**
   * Calculate unlock progress percentage
   */
  private calculateUnlockProgress(planetId: PlanetType): number | undefined {
    if (this.gameState?.planets[planetId].unlocked) return 100;
    return this.planetSystemService.calculatePlanetUnlockProgress(planetId);
  }

  /**
   * Handle planet selection
   */
  async selectPlanet(planetId: PlanetType): Promise<void> {
    if (!this.gameState?.planets[planetId].unlocked) {
      // Show unlock requirements or progress
      console.log(`Planet ${planetId} is not unlocked yet`);
      return;
    }

    try {
      const success = await this.planetSystemService.switchToPlanet(planetId);
      if (success) {
        console.log(`Switched to ${planetId} planet`);
        // Navigate to the planet's page
        await this.router.navigate(['/planet', planetId]);
      } else {
        this.error = 'Failed to switch to planet. Please try again.';
      }
    } catch (error) {
      console.error('Error switching planet:', error);
      this.error = 'Error switching to planet. Please try again.';
    }
  }

  /**
   * Collect candy from all unlocked planets
   */
  async collectAllCandy(): Promise<void> {
    try {
      const totalCollected = await this.planetSystemService.collectAllCandy();
      if (totalCollected > 0) {
        console.log(`Collected ${totalCollected} candy from all planets`);
      }
    } catch (error) {
      console.error('Error collecting candy:', error);
      this.error = 'Failed to collect candy. Please try again.';
    }
  }

  /**
   * Toggle auto-pilot mode
   */
  async toggleAutoPilot(): Promise<void> {
    try {
      this.autoPilotEnabled = await this.planetSystemService.toggleAutoPilot();
      console.log(`Auto-pilot ${this.autoPilotEnabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling auto-pilot:', error);
      this.error = 'Failed to toggle auto-pilot. Please try again.';
    }
  }

  /**
   * Retry loading data after an error
   */
  retryLoadData(): void {
    this.isLoading = true;
    this.error = null;
    
    // Re-initialize subscriptions
    this.subscribeToGameState();
    this.subscribeToCurrentPlanet();
  }

  /**
   * Check if current screen size should use mobile layout
   */
  private checkMobileLayout(): void {
    this.isMobileLayout = window.innerWidth < 768;
  }

  /**
   * Update active mobile card index based on current planet
   */
  private updateActiveMobileCard(): void {
    const planetIndex = this.planets.findIndex(p => p.id === this.currentPlanet);
    if (planetIndex !== -1) {
      this.activeMobileCard = planetIndex;
    }
  }

  /**
   * Mobile touch handling for swipe navigation
   */
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartTime = Date.now();
    this.isDragging = false;
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging && Math.abs(event.touches[0].clientX - this.touchStartX) > 10) {
      this.isDragging = true;
    }
  }

  onTouchEnd(event: TouchEvent): void {
    if (!this.isDragging) return;

    const touchEndX = event.changedTouches[0].clientX;
    const deltaX = touchEndX - this.touchStartX;
    const deltaTime = Date.now() - this.touchStartTime;

    // Swipe threshold: 50px minimum, within 500ms
    if (Math.abs(deltaX) > 50 && deltaTime < 500) {
      if (deltaX > 0 && this.activeMobileCard > 0) {
        // Swipe right - previous planet
        this.scrollToCard(this.activeMobileCard - 1);
      } else if (deltaX < 0 && this.activeMobileCard < this.planets.length - 1) {
        // Swipe left - next planet  
        this.scrollToCard(this.activeMobileCard + 1);
      }
    }

    this.isDragging = false;
  }

  /**
   * Scroll mobile view to specific card
   */
  scrollToCard(index: number): void {
    this.activeMobileCard = Math.max(0, Math.min(index, this.planets.length - 1));
    
    // Smooth scroll implementation would go here
    // For now, just update the active card
  }

  /**
   * Utility functions
   */
  formatNumber(value: number): string {
    if (value >= 1000000000) return (value / 1000000000).toFixed(1) + 'B';
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return Math.floor(value).toString();
  }

  getPlanetColor(planetId: PlanetType): string {
    const planet = this.planets.find(p => p.id === planetId);
    return planet?.color || '#FFFFFF';
  }

  getPlanetEmoji(planetId: PlanetType): string {
    const planet = this.planets.find(p => p.id === planetId);
    return planet?.emoji || '🪐';
  }
}