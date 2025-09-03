/**
 * PhBalanceSystemComponent - Complete pH Management System
 * 
 * Features:
 * - pH meter with color-coded segments
 * - pH value display and status indicators
 * - Side status effects (Too Acidic, Optimal, Too Alkaline)
 * - pH adjustment controls (Acidify, Neutralize)
 * - Visual feedback for pH ranges
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface PHBalanceMechanics {
  level: number;
  naturalAcidification: number;
  productionModifier: number;
  totalAcidEvents: number;
  fermentationActive?: boolean;
  fermentationProgress?: number;
}

interface FermentationState {
  active: boolean;
  progress: number;
  timeRemaining: number;
  bonusPercentage: number;
  canStart: boolean;
}

@Component({
  selector: 'app-ph-balance-system',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- pH Balance System - Reference Match Layout -->
    <div class="ph-balance-panel">
      <!-- pH Header -->
      <div class="ph-header">
        <h2>pH Balance System</h2>
      </div>
      
      <!-- Side Status Indicators with pH Bar -->
      <div class="ph-system-with-sides">
        <!-- Left Side Status -->
        <div class="ph-side-status left" [class.active]="(phBalance?.level || 7) < 4">
          <div class="status-text">Too Acidic</div>
          <div class="status-effect">-50% Production</div>
        </div>
        
        <!-- Center pH Bar -->
        <div class="ph-meter-center">
          <div class="ph-scale">
            <!-- Color segments for different pH ranges -->
            <div class="ph-segment acidic"></div>
            <div class="ph-segment optimal">
              <img src="/ph_ok.png" 
                   alt="pH OK" 
                   class="ph-ok-indicator" 
                   *ngIf="isPhOptimal">
            </div>
            <div class="ph-segment alkaline"></div>
            
            <!-- pH level indicator -->
            <div class="ph-indicator" 
                 [style.left.%]="getPhPercentage()" 
                 [class.optimal]="isPhOptimal" 
                 [class.danger]="isPhDangerous">
              <div class="ph-indicator-dot"></div>
              <div class="ph-indicator-value">{{ (phBalance?.level || 7).toFixed(1) }}</div>
            </div>
          </div>
          
          <!-- pH Scale Numbers - ENHANCED VISIBILITY -->
          <div class="ph-scale-numbers">
            <span class="ph-number" style="left: 0%">0</span>
            <span class="ph-number" style="left: 14.3%">2</span>
            <span class="ph-number" style="left: 28.6%">4</span>
            <span class="ph-number" style="left: 42.9%">6</span>
            <span class="ph-number optimal" style="left: 50%">7</span>
            <span class="ph-number" style="left: 57.1%">8</span>
            <span class="ph-number" style="left: 71.4%">10</span>
            <span class="ph-number" style="left: 85.7%">12</span>
            <span class="ph-number" style="left: 100%">14</span>
          </div>
          
          <!-- pH Scale Labels - REFERENCE MATCH -->
          <div class="ph-labels-reference">
            <span class="ph-label acidic-left">Acidic 0</span>
            <span class="ph-label acidic-range">Acidic (0</span>
            <span class="ph-label optimal-center">
              <div class="optimal-main">Optimal pH</div>
              <div class="optimal-sub">Normal Production</div>
            </span>
            <span class="ph-label alkaline-range">Alkaline)</span>
            <span class="ph-label alkaline-right">Alkaline (10)</span>
          </div>
        </div>
        
        <!-- Right Side Status -->
        <div class="ph-side-status right" [class.active]="(phBalance?.level || 7) > 6.5">
          <div class="status-text">Too Alkaline</div>
          <div class="status-effect">-30% Production</div>
        </div>
      </div>

      <!-- Fermentation System Integration -->
      <div class="fermentation-integration" *ngIf="isPhOptimal || phBalance?.fermentationActive">
        <div class="fermentation-status-bar">
          <!-- Fermentation Ready State -->
          <div *ngIf="!phBalance?.fermentationActive && isPhOptimal" class="fermentation-ready">
            <div class="fermentation-ready-indicator">
              <img src="/beaker.png" alt="Ready to Ferment" class="fermentation-icon">
              <span class="fermentation-ready-text">Fermentation Ready</span>
            </div>
            <button 
              class="fermentation-start-btn" 
              (click)="onStartFermentation()"
              [disabled]="!canStartFermentation">
              <span class="btn-icon">🫙</span>
              <span class="btn-text">Start Process</span>
            </button>
          </div>
          
          <!-- Active Fermentation Display -->
          <div *ngIf="phBalance?.fermentationActive" class="fermentation-active">
            <div class="fermentation-header">
              <div class="fermentation-title">
                <img src="/beaker.png" alt="Active Fermentation" class="fermentation-icon active">
                <span class="fermentation-title-text">Active Fermentation</span>
              </div>
              <div class="fermentation-percentage">{{ getFermentationPercentage() }}%</div>
            </div>
            
            <div class="fermentation-progress-container">
              <div class="fermentation-progress-bar">
                <div class="fermentation-progress-fill" 
                     [style.width.%]="(phBalance?.fermentationProgress || 0) * 100"></div>
                <div class="progress-bubbles">
                  <div class="bubble" *ngFor="let bubble of getBubbleArray()" 
                       [class.active]="bubble <= (phBalance?.fermentationProgress || 0) * 20"></div>
                </div>
              </div>
              
              <div class="fermentation-stats">
                <div class="stat-group">
                  <span class="stat-label">Time Left:</span>
                  <span class="stat-value">{{ getRemainingTime() }}</span>
                </div>
                <div class="stat-group">
                  <span class="stat-label">Bonus:</span>
                  <span class="stat-value bonus">+{{ getFermentationBonus() }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- pH Adjustment Controls -->
      <div class="ph-controls">
        <button 
          class="ph-adjust acidify" 
          (click)="onAcidify()"
          [disabled]="!canAdjustPH || (phBalance?.level || 7) <= 1">
          Acidify (+0.6)
        </button>
        <button 
          class="ph-adjust neutralize" 
          (click)="onNeutralize()"
          [disabled]="!canAdjustPH || (phBalance?.level || 7) >= 13">
          Neutralize (+0.5)
        </button>
      </div>
    </div>
  `,
  styleUrl: './ph-balance-system.component.scss'
})
export class PhBalanceSystemComponent {
  @Input() phBalance: PHBalanceMechanics | null = null;
  @Input() canAdjustPH: boolean = true;
  @Input() canStartFermentation: boolean = false;

  @Output() phAdjusted = new EventEmitter<number>();
  @Output() fermentationStarted = new EventEmitter<void>();

  /**
   * Check if pH is in optimal range (4.0 - 6.5)
   */
  get isPhOptimal(): boolean {
    const ph = this.phBalance?.level || 7;
    return ph >= 4.0 && ph <= 6.5;
  }

  /**
   * Check if pH is in dangerous range
   */
  get isPhDangerous(): boolean {
    const ph = this.phBalance?.level || 7;
    return ph < 2.0 || ph > 12.0;
  }

  /**
   * Calculate pH percentage position on the meter (0-100%)
   */
  getPhPercentage(): number {
    const ph = this.phBalance?.level || 7;
    return Math.min(100, Math.max(0, (ph / 14) * 100));
  }

  /**
   * Handle acidify button click
   */
  onAcidify(): void {
    if (!this.canAdjustPH || !this.phBalance || this.phBalance.level <= 1) return;
    this.phAdjusted.emit(-0.5);
  }

  /**
   * Handle neutralize button click
   */
  onNeutralize(): void {
    if (!this.canAdjustPH || !this.phBalance || this.phBalance.level >= 13) return;
    this.phAdjusted.emit(0.5);
  }

  /**
   * Get production modifier based on current pH
   */
  getPhProductionModifier(): number {
    const ph = this.phBalance?.level || 7;
    if (ph < 4.0) return 0.5;  // Too acidic
    if (ph > 6.5) return 0.7;  // Too alkaline  
    return 1.0; // Optimal
  }

  /**
   * Get status text for current pH level
   */
  getPhStatusText(): string {
    const ph = this.phBalance?.level || 7;
    if (ph < 2.0) return 'Extremely Acidic - Dangerous!';
    if (ph < 4.0) return 'Too Acidic - Reduced Production';
    if (ph >= 4.0 && ph <= 6.5) return 'Optimal Range - Maximum Production';
    if (ph > 6.5 && ph <= 12.0) return 'Too Alkaline - Reduced Production';
    return 'Extremely Alkaline - Dangerous!';
  }

  /**
   * Get CSS class for current pH status
   */
  getPhStatusClass(): string {
    const ph = this.phBalance?.level || 7;
    if (ph < 4.0 || ph > 6.5) return 'suboptimal';
    if (ph < 2.0 || ph > 12.0) return 'dangerous';
    return 'optimal';
  }

  /**
   * Fermentation System Methods
   */

  /**
   * Handle start fermentation button click
   */
  onStartFermentation(): void {
    if (!this.canStartFermentation || !this.isPhOptimal) return;
    this.fermentationStarted.emit();
  }

  /**
   * Get fermentation percentage as integer
   */
  getFermentationPercentage(): number {
    return Math.floor((this.phBalance?.fermentationProgress || 0) * 100);
  }

  /**
   * Get fermentation bonus percentage
   */
  getFermentationBonus(): number {
    if (this.phBalance?.fermentationActive && this.phBalance.fermentationProgress !== undefined) {
      return Math.floor(this.phBalance.fermentationProgress * 50); // Up to 50% bonus
    }
    return 0;
  }

  /**
   * Get remaining fermentation time
   */
  getRemainingTime(): string {
    if (!this.phBalance?.fermentationActive || this.phBalance.fermentationProgress === undefined) {
      return '0s';
    }

    const totalTime = 50; // 50 seconds total fermentation time
    const remainingProgress = 1 - this.phBalance.fermentationProgress;
    const remainingSeconds = Math.ceil(remainingProgress * totalTime);

    if (remainingSeconds <= 0) return '0s';
    if (remainingSeconds < 60) return `${remainingSeconds}s`;
    
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }

  /**
   * Get bubble array for fermentation animation
   */
  getBubbleArray(): number[] {
    return Array.from({length: 20}, (_, i) => i + 1);
  }

  /**
   * Check if fermentation can be started
   */
  get canStartFermentationProcess(): boolean {
    return this.isPhOptimal && !this.phBalance?.fermentationActive && this.canStartFermentation;
  }

  /**
   * Get fermentation state for styling
   */
  get fermentationState(): FermentationState {
    return {
      active: this.phBalance?.fermentationActive || false,
      progress: this.phBalance?.fermentationProgress || 0,
      timeRemaining: this.getRemainingTimeSeconds(),
      bonusPercentage: this.getFermentationBonus(),
      canStart: this.canStartFermentationProcess
    };
  }

  /**
   * Get remaining time in seconds for calculations
   */
  private getRemainingTimeSeconds(): number {
    if (!this.phBalance?.fermentationActive || this.phBalance.fermentationProgress === undefined) {
      return 0;
    }
    const totalTime = 50;
    const remainingProgress = 1 - this.phBalance.fermentationProgress;
    return Math.ceil(remainingProgress * totalTime);
  }
}