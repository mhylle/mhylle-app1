/**
 * UpgradesPanelComponent - Equipment Upgrades Sidebar
 * 
 * Features:
 * - Right sidebar with upgrade tiers
 * - Individual upgrade items with icons
 * - Buy/purchase functionality
 * - Locked/unlocked states
 * - Cost calculation and display
 * - Level tracking
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface PlanetState {
  id: string;
  unlocked: boolean;
  candy: number;
  clickPower: number;
  productionPerSecond: number;
  upgrades: Record<string, number>;
  unlockedUpgrades: string[];
  specialMechanics?: any;
  resources: { exports: any; imports: any };
  achievements: Record<string, any>;
  discoveredCandies: string[];
  lastActive: number;
  totalTimeActive: number;
  totalClicks: number;
}

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
  selector: 'app-upgrades-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Refined Upgrades Panel - Efficient & Integrated -->
    <div class="upgrades-panel" role="complementary" aria-label="Equipment upgrades">
      <!-- Streamlined Header -->
      <div class="panel-header">
        <div class="header-content">
          <span class="header-icon">⚗️</span>
          <div class="header-info">
            <h2>Lab Equipment</h2>
            <div class="header-stats">
              <span class="owned-count">{{ getActiveUpgrades() }}/{{ upgrades.length }}</span>
              <span class="production">+{{ getTotalProduction().toFixed(1) }}/s</span>
            </div>
          </div>
        </div>
        <div class="currency">
          <img src="sour_candy.png" alt="Sour Candy" class="currency-icon">
          <span class="amount">{{ formatNumber(planetState?.candy || 0) }}</span>
        </div>
      </div>
        
      <!-- Compact Upgrade Grid -->
      <div class="upgrade-grid">
        <div *ngFor="let upgrade of upgrades; trackBy: trackByUpgradeId" 
             class="upgrade-card"
             [class.owned]="getUpgradeLevel(upgrade.id) > 0"
             [class.affordable]="canAffordUpgrade(upgrade.id)"
             [class.locked]="!canAffordUpgrade(upgrade.id) && getUpgradeLevel(upgrade.id) === 0"
             [class.premium]="isUpgradeCostEffective(upgrade.id)">
          
          <!-- Icon with Level Badge -->
          <div class="upgrade-icon-wrapper">
            <img [src]="upgrade.icon" 
                 [alt]="upgrade.name" 
                 class="upgrade-icon"
                 [class.grayscale]="!canAffordUpgrade(upgrade.id) && getUpgradeLevel(upgrade.id) === 0">
            <div class="level-badge" *ngIf="getUpgradeLevel(upgrade.id) > 0">
              {{ getUpgradeLevel(upgrade.id) }}
            </div>
            <div class="efficiency-badge" 
                 *ngIf="isUpgradeCostEffective(upgrade.id) && canAffordUpgrade(upgrade.id)"
                 title="High efficiency">★</div>
          </div>
          
          <!-- Compact Info -->
          <div class="upgrade-details">
            <div class="upgrade-name">{{ upgrade.name }}</div>
            <div class="upgrade-stats">
              <span class="production" *ngIf="getUpgradeLevel(upgrade.id) > 0; else newProduction">
                {{ getTotalUpgradeBonus(upgrade.id).toFixed(1) }}/s
                <small>+{{ upgrade.productionBonus.toFixed(1) }}</small>
              </span>
              <ng-template #newProduction>
                <span class="production preview" *ngIf="canAffordUpgrade(upgrade.id)">
                  +{{ upgrade.productionBonus.toFixed(1) }}/s
                </span>
              </ng-template>
            </div>
          </div>
          
          <!-- Action Button -->
          <div class="upgrade-action">
            <!-- Buy Button -->
            <button *ngIf="canAffordUpgrade(upgrade.id) || getUpgradeLevel(upgrade.id) > 0"
                    class="buy-btn"
                    [class.premium]="isUpgradeCostEffective(upgrade.id)"
                    [disabled]="!canAffordUpgrade(upgrade.id)"
                    (click)="onBuyUpgrade(upgrade.id)"
                    [attr.aria-label]="getBuyButtonLabel(upgrade)">
              <div class="btn-content">
                <span class="btn-cost">{{ formatNumber(getUpgradeCost(upgrade.id)) }}</span>
                <span class="btn-icon">{{ getUpgradeLevel(upgrade.id) > 0 ? '↗' : '+' }}</span>
              </div>
            </button>
            
            <!-- Locked State -->
            <div *ngIf="!canAffordUpgrade(upgrade.id) && getUpgradeLevel(upgrade.id) === 0"
                 class="locked-state">
              <div class="lock-cost">{{ formatNumber(getUpgradeCost(upgrade.id)) }}</div>
              <div class="progress-mini">
                <div class="progress-fill" 
                     [style.width.%]="Math.min(100, ((planetState?.candy || 0) / getUpgradeCost(upgrade.id)) * 100)"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './upgrades-panel.component.scss'
})
export class UpgradesPanelComponent {
  @Input() upgrades: SourUpgrade[] = [];
  @Input() planetState: PlanetState | null = null;

  @Output() upgradePurchased = new EventEmitter<string>();

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
    const upgrade = this.upgrades.find(u => u.id === upgradeId);
    if (!upgrade) return 0;
    
    const currentLevel = this.getUpgradeLevel(upgradeId);
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
  }

  /**
   * Check if player can afford an upgrade
   */
  canAffordUpgrade(upgradeId: string): boolean {
    if (!this.planetState) return false;
    
    const cost = this.getUpgradeCost(upgradeId);
    const upgrade = this.upgrades.find(u => u.id === upgradeId);
    const currentCandy = this.planetState.candy || 0;
    
    // Check unlock requirements
    if (upgrade?.unlockRequirement) {
      if (upgrade.unlockRequirement.candy && currentCandy < upgrade.unlockRequirement.candy) {
        return false;
      }
    }
    
    return currentCandy >= cost;
  }

  /**
   * Handle buy upgrade button click
   */
  onBuyUpgrade(upgradeId: string): void {
    if (!this.canAffordUpgrade(upgradeId)) return;
    this.upgradePurchased.emit(upgradeId);
  }

  /**
   * Format large numbers with K/M/B suffixes
   */
  formatNumber(value: number): string {
    if (value >= 1000000000) return (value / 1000000000).toFixed(1) + 'B';
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return Math.floor(value).toString();
  }

  /**
   * Get accessibility label for buy button
   */
  getBuyButtonLabel(upgrade: SourUpgrade): string {
    const cost = this.getUpgradeCost(upgrade.id);
    const level = this.getUpgradeLevel(upgrade.id);
    const affordable = this.canAffordUpgrade(upgrade.id);
    
    if (!affordable) {
      return `Cannot afford ${upgrade.name} level ${level + 1} - costs ${this.formatNumber(cost)} sour candy`;
    }
    
    return `Buy ${upgrade.name} level ${level + 1} for ${this.formatNumber(cost)} sour candy - adds ${upgrade.productionBonus}/sec production`;
  }

  /**
   * Get upgrade efficiency (production per cost)
   */
  getUpgradeEfficiency(upgradeId: string): number {
    const upgrade = this.upgrades.find(u => u.id === upgradeId);
    if (!upgrade) return 0;
    
    const cost = this.getUpgradeCost(upgradeId);
    return upgrade.productionBonus / cost;
  }

  /**
   * Get total production bonus for an upgrade
   */
  getTotalUpgradeBonus(upgradeId: string): number {
    const upgrade = this.upgrades.find(u => u.id === upgradeId);
    if (!upgrade) return 0;
    
    const level = this.getUpgradeLevel(upgradeId);
    return upgrade.productionBonus * level;
  }

  /**
   * Check if upgrade is cost-effective
   */
  isUpgradeCostEffective(upgradeId: string): boolean {
    const efficiency = this.getUpgradeEfficiency(upgradeId);
    const averageEfficiency = this.upgrades.reduce((sum, u) => 
      sum + this.getUpgradeEfficiency(u.id), 0) / this.upgrades.length;
    
    return efficiency >= averageEfficiency * 0.8; // Within 80% of average efficiency
  }

  /**
   * Get the number of active (owned) upgrades
   */
  getActiveUpgrades(): number {
    return this.upgrades.filter(u => this.getUpgradeLevel(u.id) > 0).length;
  }

  /**
   * Get the number of owned upgrades
   */
  getOwnedUpgrades(): number {
    return this.getActiveUpgrades();
  }

  /**
   * Get total production from base production plus all upgrades
   */
  getTotalProduction(): number {
    // Get upgrade bonuses
    const upgradeProduction = this.upgrades.reduce((total, upgrade) => {
      return total + this.getTotalUpgradeBonus(upgrade.id);
    }, 0);
    
    // Add base production from planet state (includes pH modifiers)
    const baseProduction = this.planetState?.productionPerSecond || 0;
    
    return baseProduction;
  }

  /**
   * Get upgrade progress as percentage (owned/total)
   */
  getUpgradeProgress(): number {
    if (this.upgrades.length === 0) return 0;
    return (this.getOwnedUpgrades() / this.upgrades.length) * 100;
  }

  /**
   * TrackBy function for ngFor performance
   */
  trackByUpgradeId(index: number, upgrade: SourUpgrade): string {
    return upgrade.id;
  }

  /**
   * Expose Math for template
   */
  readonly Math = Math;
}