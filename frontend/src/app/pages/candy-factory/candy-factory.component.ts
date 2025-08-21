import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CandyFactoryService } from '../../services/candy-factory.service';
import { AchievementService } from '../../services/achievement.service';
import { GameState, CandyUpgrade, FloatingNumber, Particle, FlyingCandy, PrestigeData } from '../../models/candy-factory.interface';
import { CANDY_UPGRADES, UPGRADE_TIERS } from '../../models/candy-upgrades.data';
import { AchievementGalleryComponent } from '../../components/achievement-gallery/achievement-gallery.component';
import { Observable } from 'rxjs';
import { Achievement } from '../../models/candy-factory.interface';

@Component({
  selector: 'app-candy-factory',
  standalone: true,
  imports: [CommonModule, AchievementGalleryComponent],
  template: `
    <div class="candy-factory" [style.background]="'url(data:image/svg+xml;base64,' + starfieldBackground + ') repeat'">
      <!-- Game Header -->
      <div class="game-header">
        <div class="candy-counter">
          <h1>🍭 Cosmic Candy Factory</h1>
          <div class="stats">
            <div class="stat">
              <span class="label">Candy:</span>
              <span class="value">{{candyFactoryService.formatNumber((gameState$ | async)?.candy || 0)}}</span>
            </div>
            <div class="stat">
              <span class="label">Per Click:</span>
              <span class="value">{{candyFactoryService.formatNumber((gameState$ | async)?.clickPower || 1)}}</span>
            </div>
            <div class="stat">
              <span class="label">Per Second:</span>
              <span class="value">{{candyFactoryService.formatNumber((gameState$ | async)?.productionPerSecond || 0)}}</span>
            </div>
            <div class="stat" *ngIf="(gameState$ | async)?.prestigeLevel! > 0">
              <span class="label">Prestige:</span>
              <span class="value">Level {{(gameState$ | async)?.prestigeLevel}} ({{candyFactoryService.formatNumber((gameState$ | async)?.prestigeMultiplier || 1)}}x)</span>
            </div>
          </div>
        </div>
        <div class="game-controls">
          <button class="achievement-btn" (click)="showAchievementGallery = true">
            🏆 Achievements
          </button>
          <button class="prestige-btn" 
                  (click)="showPrestigeModal = true"
                  *ngIf="getPrestigeData().canPrestige || (gameState$ | async)?.prestigeLevel! > 0">
            ⭐ Prestige
          </button>
          <button class="reset-btn" (click)="resetGame()">🔄 Reset Game</button>
        </div>
      </div>

      <!-- Main Game Area -->
      <div class="game-area">
        <!-- Planet Clicking Area -->
        <div class="planet-container">
          <div 
            class="candy-planet" 
            (click)="onPlanetClick($event)"
            [class.clicked]="planetClicked"
            #candyPlanet>
            <div class="planet-core">🪐</div>
            <div class="planet-ring"></div>
            <div class="planet-glow"></div>
          </div>
          
          <!-- Factory Decorations -->
          <div class="factory-decorations">
            <div *ngFor="let upgrade of getVisibleFactoryUpgrades()" 
                 class="factory-item"
                 [style.transform]="getFactoryItemTransform(upgrade.id)">
              {{upgrade.icon}}
            </div>
          </div>
        </div>

        <!-- Upgrades Panel -->
        <div class="upgrades-panel">
          <h2>🛠️ Upgrades</h2>
          
          <!-- Upgrade Tiers -->
          <div *ngFor="let tier of upgradeTiers" class="upgrade-tier">
            <div class="tier-header" [style.color]="tier.color">
              <h3>{{tier.name}}</h3>
            </div>
            
            <div class="upgrade-list">
              <div *ngFor="let upgrade of getUpgradesForTier(tier.tier)" 
                   class="upgrade-item"
                   [class.unlocked]="candyFactoryService.isUpgradeUnlocked(upgrade.id)"
                   [class.affordable]="canAffordUpgrade(upgrade)">
                
                <div class="upgrade-info">
                  <div class="upgrade-icon">{{upgrade.icon}}</div>
                  <div class="upgrade-details">
                    <div class="upgrade-name">{{upgrade.name}}</div>
                    <div class="upgrade-description">{{upgrade.description}}</div>
                    <div class="upgrade-level">Level: {{candyFactoryService.getUpgradeLevel(upgrade.id)}}</div>
                  </div>
                </div>
                
                <div class="upgrade-purchase" 
                     *ngIf="candyFactoryService.isUpgradeUnlocked(upgrade.id)">
                  <div class="upgrade-price">
                    {{candyFactoryService.formatNumber(candyFactoryService.calculateUpgradePrice(upgrade, candyFactoryService.getUpgradeLevel(upgrade.id)))}} 🍭
                  </div>
                  <button 
                    class="buy-btn"
                    [disabled]="!canAffordUpgrade(upgrade)"
                    (click)="purchaseUpgrade(upgrade.id)">
                    Buy
                  </button>
                </div>
                
                <div class="upgrade-locked" 
                     *ngIf="!candyFactoryService.isUpgradeUnlocked(upgrade.id)">
                  <div class="lock-icon">🔒</div>
                  <div class="unlock-requirement">{{getUnlockRequirementText(upgrade)}}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Floating Numbers -->
      <div class="floating-numbers">
        <div *ngFor="let floatingNumber of floatingNumbers$ | async"
             class="floating-number"
             [style.left.px]="floatingNumber.x"
             [style.top.px]="floatingNumber.y"
             [style.color]="floatingNumber.color">
          +{{candyFactoryService.formatNumber(floatingNumber.value)}}
        </div>
      </div>

      <!-- Particles -->
      <div class="particles">
        <div *ngFor="let particle of particles$ | async"
             class="particle"
             [style.left.px]="particle.x"
             [style.top.px]="particle.y"
             [style.width.px]="particle.size"
             [style.height.px]="particle.size"
             [style.background-color]="particle.color">
        </div>
      </div>

      <!-- Flying Candies -->
      <div class="flying-candies">
        <div *ngFor="let flyingCandy of flyingCandies$ | async"
             class="flying-candy"
             [style.left.px]="flyingCandy.x - (flyingCandy.size / 2)"
             [style.top.px]="flyingCandy.y - (flyingCandy.size / 2)"
             [style.width.px]="flyingCandy.size"
             [style.height.px]="flyingCandy.size"
             [style.background-color]="flyingCandy.color"
             [style.opacity]="flyingCandy.life"
             [style.border-color]="flyingCandy.color === '#ffd700' ? '#ffff00' : '#ff1493'"
             (click)="onFlyingCandyClick(flyingCandy.id, $event)"
             title="Click for bonus candy! Value: {{candyFactoryService.formatNumber(flyingCandy.value)}}">
          🍬
        </div>
      </div>

      <!-- Prestige Modal -->
      <div class="prestige-modal-overlay" *ngIf="showPrestigeModal" (click)="showPrestigeModal = false">
        <div class="prestige-modal" (click)="$event.stopPropagation()">
          <h2>⭐ Prestige System</h2>
          <div class="prestige-info">
            <p>Prestiging will reset your progress but give you permanent bonuses!</p>
            
            <div class="prestige-stats">
              <div class="prestige-stat">
                <span class="label">Required Candy:</span>
                <span class="value">{{candyFactoryService.formatNumber(getPrestigeData().requiredCandy)}}</span>
              </div>
              <div class="prestige-stat">
                <span class="label">Prestige Points Gained:</span>
                <span class="value">{{getPrestigeData().prestigePointsGained}}</span>
              </div>
              <div class="prestige-stat">
                <span class="label">New Multiplier:</span>
                <span class="value">{{getPrestigeData().newMultiplier.toFixed(1)}}x</span>
              </div>
              <div class="prestige-stat" *ngIf="(gameState$ | async)?.prestigeLevel! > 0">
                <span class="label">Current Level:</span>
                <span class="value">{{(gameState$ | async)?.prestigeLevel}}</span>
              </div>
            </div>

            <div class="prestige-warning" *ngIf="getPrestigeData().canPrestige">
              <p>⚠️ This will reset all candy, upgrades, and progress!</p>
              <p>✅ You will keep prestige bonuses and multipliers!</p>
            </div>

            <div class="prestige-requirement" *ngIf="!getPrestigeData().canPrestige">
              <p>You need {{candyFactoryService.formatNumber(getPrestigeData().requiredCandy)}} total candy earned to prestige.</p>
              <p>Current: {{candyFactoryService.formatNumber((gameState$ | async)?.totalCandyEarned || 0)}}</p>
            </div>
          </div>

          <div class="prestige-actions">
            <button class="prestige-confirm-btn" 
                    [disabled]="!getPrestigeData().canPrestige"
                    (click)="performPrestige()">
              ⭐ Prestige Now!
            </button>
            <button class="prestige-cancel-btn" (click)="showPrestigeModal = false">
              Cancel
            </button>
          </div>
        </div>
      </div>

      <!-- Achievement Notifications -->
      <div class="achievement-notifications">
        <div *ngFor="let achievement of recentAchievements$ | async" 
             class="achievement-notification"
             [style.border-color]="getRarityColor(achievement.rarity)"
             [style.box-shadow]="'0 0 20px ' + getRarityGlow(achievement.rarity)">
          <div class="notification-header">🎉 Achievement Unlocked!</div>
          <div class="notification-icon" 
               [style.color]="getRarityColor(achievement.rarity)"
               [style.text-shadow]="'0 0 10px ' + getRarityColor(achievement.rarity)">
            {{achievement.icon}}
          </div>
          <div class="notification-name" [style.color]="getRarityColor(achievement.rarity)">
            {{achievement.name}}
          </div>
          <div class="notification-description">{{achievement.description}}</div>
          <div class="notification-rarity" [style.color]="getRarityColor(achievement.rarity)">
            {{achievement.rarity.toUpperCase()}}
          </div>
        </div>
      </div>

      <!-- Achievement Gallery -->
      <app-achievement-gallery *ngIf="showAchievementGallery" (closeGalleryEvent)="showAchievementGallery = false">
      </app-achievement-gallery>
    </div>
  `,
  styleUrls: ['./candy-factory.component.css']
})
export class CandyFactoryComponent implements OnInit, OnDestroy {
  gameState$: Observable<GameState>;
  floatingNumbers$: Observable<FloatingNumber[]>;
  particles$: Observable<Particle[]>;
  flyingCandies$: Observable<FlyingCandy[]>;
  recentAchievements$: Observable<Achievement[]>;
  
  upgradeTiers = UPGRADE_TIERS;
  planetClicked = false;
  starfieldBackground: string;
  showPrestigeModal = false;
  showAchievementGallery = false;

  constructor(
    public candyFactoryService: CandyFactoryService,
    public achievementService: AchievementService
  ) {
    this.gameState$ = this.candyFactoryService.gameState$;
    this.floatingNumbers$ = this.candyFactoryService.floatingNumbers$;
    this.particles$ = this.candyFactoryService.particles$;
    this.flyingCandies$ = this.candyFactoryService.flyingCandies$;
    this.recentAchievements$ = this.achievementService.recentlyUnlocked$;
    this.starfieldBackground = this.generateStarfieldBackground();
  }

  ngOnInit(): void {
    // Component initialization
  }

  ngOnDestroy(): void {
    // Cleanup handled by service
  }

  onPlanetClick(event: MouseEvent): void {
    this.planetClicked = true;
    setTimeout(() => this.planetClicked = false, 150);
    
    this.candyFactoryService.clickPlanet({
      clientX: event.clientX,
      clientY: event.clientY
    });
  }

  purchaseUpgrade(upgradeId: string): void {
    const result = this.candyFactoryService.purchaseUpgrade(upgradeId);
    if (!result.success && result.errorMessage) {
      console.warn('Purchase failed:', result.errorMessage);
    }
  }

  canAffordUpgrade(upgrade: CandyUpgrade): boolean {
    const currentGameState = this.candyFactoryService.currentGameState;
    if (!currentGameState) return false;
    
    const price = this.candyFactoryService.calculateUpgradePrice(
      upgrade, 
      this.candyFactoryService.getUpgradeLevel(upgrade.id)
    );
    return currentGameState.candy >= price;
  }

  getUpgradesForTier(tier: number): CandyUpgrade[] {
    return CANDY_UPGRADES.filter(upgrade => upgrade.tier === tier);
  }

  getUnlockRequirementText(upgrade: CandyUpgrade): string {
    switch (upgrade.unlockRequirement.type) {
      case 'candy':
        return `Need ${this.candyFactoryService.formatNumber(upgrade.unlockRequirement.value as number)} total candy`;
      case 'production':
        return `Need ${this.candyFactoryService.formatNumber(upgrade.unlockRequirement.value as number)} candy/sec`;
      case 'upgrade':
        const requiredUpgrade = CANDY_UPGRADES.find(u => u.id === upgrade.unlockRequirement.value);
        return `Need ${requiredUpgrade?.name || 'Unknown Upgrade'}`;
      default:
        return 'Unknown requirement';
    }
  }

  getVisibleFactoryUpgrades(): CandyUpgrade[] {
    return CANDY_UPGRADES.filter(upgrade => 
      upgrade.type === 'production' && 
      this.candyFactoryService.getUpgradeLevel(upgrade.id) > 0
    );
  }

  getFactoryItemTransform(upgradeId: string): string {
    const index = this.getVisibleFactoryUpgrades().findIndex(u => u.id === upgradeId);
    const angle = (index * 45) % 360;
    const radius = 120 + (index * 10);
    return `rotate(${angle}deg) translateX(${radius}px)`;
  }

  onFlyingCandyClick(candyId: string, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.candyFactoryService.clickFlyingCandy(candyId);
  }

  getPrestigeData(): PrestigeData {
    return this.candyFactoryService.getPrestigeData();
  }

  performPrestige(): void {
    if (confirm('Are you sure you want to prestige? This will reset your progress but give you permanent bonuses!')) {
      const success = this.candyFactoryService.performPrestige();
      if (success) {
        this.showPrestigeModal = false;
      }
    }
  }

  resetGame(): void {
    if (confirm('Are you sure you want to reset your progress? This cannot be undone!')) {
      this.candyFactoryService.resetGame();
    }
  }

  private generateStarfieldBackground(): string {
    // Generate a simple starfield pattern as base64 SVG
    const svg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#0a0a1a"/>
        ${Array.from({length: 50}, () => {
          const x = Math.random() * 200;
          const y = Math.random() * 200;
          const size = Math.random() * 2 + 0.5;
          const opacity = Math.random() * 0.8 + 0.2;
          return `<circle cx="${x}" cy="${y}" r="${size}" fill="white" opacity="${opacity}"/>`;
        }).join('')}
      </svg>
    `;
    return btoa(svg);
  }

  getRarityColor(rarity: string): string {
    return this.achievementService.getRarityColor(rarity);
  }

  getRarityGlow(rarity: string): string {
    const glowColors = {
      common: 'rgba(255, 255, 255, 0.3)',
      rare: 'rgba(0, 255, 0, 0.4)',
      epic: 'rgba(138, 43, 226, 0.5)',
      legendary: 'rgba(255, 165, 0, 0.6)',
      mythic: 'rgba(255, 20, 147, 0.7)'
    };
    return glowColors[rarity as keyof typeof glowColors] || 'rgba(255, 255, 255, 0.3)';
  }

  @HostListener('window:beforeunload')
  onBeforeUnload(): void {
    // Ensure game is saved before page unload
    this.candyFactoryService.ngOnDestroy();
  }
}