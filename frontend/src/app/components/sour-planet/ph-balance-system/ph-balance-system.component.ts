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

import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
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
    <section class="ph-balance-panel" 
             role="region" 
             aria-labelledby="ph-system-heading">
      <!-- pH Header -->
      <header class="ph-header">
        <h2 id="ph-system-heading">pH Balance System</h2>
      </header>
      
      <!-- Side Status Indicators with pH Bar -->
      <div class="ph-system-with-sides" role="group" aria-labelledby="ph-meter-label">
        <span id="ph-meter-label" class="sr-only">pH measurement and status indicators</span>
        
        <!-- Left Side Status -->
        <div class="ph-side-status left" 
             [class.active]="(phBalance?.level || 7) < 4"
             role="status"
             [attr.aria-label]="'Acidic status: ' + ((phBalance?.level || 7) < 4 ? 'active' : 'inactive')">
          <div class="status-text" aria-hidden="true">Too Acidic</div>
          <div class="status-effect" aria-hidden="true">-50% Production</div>
          <span class="sr-only">
            {{ (phBalance?.level || 7) < 4 ? 'Too acidic: 50% production penalty active' : 'Acidic threshold inactive' }}
          </span>
        </div>
        
        <!-- Center pH Bar -->
        <div class="ph-meter-center" role="meter" 
             [attr.aria-valuenow]="phBalance?.level || 7"
             [attr.aria-valuemin]="0"
             [attr.aria-valuemax]="14"
             [attr.aria-valuetext]="'pH ' + (phBalance?.level || 7).toFixed(1) + '. Status: ' + getPhStatusText()">
          <div class="ph-scale" role="presentation">
            <!-- Color segments for different pH ranges -->
            <div class="ph-segment acidic" role="presentation" aria-label="Acidic range"></div>
            <div class="ph-segment optimal" role="presentation" aria-label="Optimal range">
              <img src="ph_ok.png" 
                   alt="pH in optimal range" 
                   class="ph-ok-indicator" 
                   *ngIf="isPhOptimal"
                   role="img"
                   aria-describedby="ph-optimal-description">
              <span id="ph-optimal-description" class="sr-only">pH is in the optimal range for maximum production</span>
            </div>
            <div class="ph-segment alkaline" role="presentation" aria-label="Alkaline range"></div>
            
            <!-- pH level indicator -->
            <div class="ph-indicator" 
                 [style.left.%]="getPhPercentage()" 
                 [class.optimal]="isPhOptimal" 
                 [class.danger]="isPhDangerous"
                 role="presentation">
              <div class="ph-indicator-dot" role="presentation"></div>
              <div class="ph-indicator-value" role="presentation">{{ (phBalance?.level || 7).toFixed(1) }}</div>
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
        <div class="ph-side-status right" 
             [class.active]="(phBalance?.level || 7) > 6.5"
             role="status"
             [attr.aria-label]="'Alkaline status: ' + ((phBalance?.level || 7) > 6.5 ? 'active' : 'inactive')">
          <div class="status-text" aria-hidden="true">Too Alkaline</div>
          <div class="status-effect" aria-hidden="true">-30% Production</div>
          <span class="sr-only">
            {{ (phBalance?.level || 7) > 6.5 ? 'Too alkaline: 30% production penalty active' : 'Alkaline threshold inactive' }}
          </span>
        </div>
      </div>

      <!-- Fermentation System Integration -->
      <section class="fermentation-integration" 
               *ngIf="isPhOptimal || phBalance?.fermentationActive"
               role="region" 
               aria-labelledby="fermentation-heading">
        <h3 id="fermentation-heading" class="sr-only">Fermentation Process</h3>
        <div class="fermentation-status-bar" role="group" [attr.aria-label]="phBalance?.fermentationActive ? 'Active fermentation process' : 'Fermentation ready to start'">
          <!-- Fermentation Ready State -->
          <div *ngIf="!phBalance?.fermentationActive && isPhOptimal" 
               class="fermentation-ready"
               role="status"
               aria-live="polite">
            <div class="fermentation-ready-indicator">
              <img src="beaker.png" alt="Fermentation ready indicator" class="fermentation-icon" role="img">
              <span class="fermentation-ready-text">Fermentation Ready</span>
            </div>
            <button 
              class="fermentation-start-btn" 
              type="button"
              (click)="onStartFermentation()"
              [disabled]="!canStartFermentation"
              [attr.aria-label]="'Start fermentation process' + (!canStartFermentation ? ' - currently disabled' : '')"
              [attr.aria-describedby]="'fermentation-description'">
              <span class="btn-icon" role="presentation" aria-hidden="true">🫙</span>
              <span class="btn-text">Start Process</span>
            </button>
            <span id="fermentation-description" class="sr-only">
              Fermentation will provide bonus production when pH is optimal
            </span>
          </div>
          
          <!-- Active Fermentation Display -->
          <div *ngIf="phBalance?.fermentationActive" class="fermentation-active">
            <div class="fermentation-header">
              <div class="fermentation-title">
                <img src="beaker.png" alt="Active Fermentation" class="fermentation-icon active">
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
      </section>

      <!-- pH Adjustment Controls -->
      <div class="ph-controls" role="group" aria-labelledby="ph-controls-heading">
        <h3 id="ph-controls-heading" class="sr-only">pH Adjustment Controls</h3>
        <button 
          class="ph-adjust acidify" 
          type="button"
          (click)="onAcidify()"
          [disabled]="!canAdjustPH || (phBalance?.level || 7) <= 1"
          [attr.aria-label]="'Lower pH by 0.5 points. Current pH: ' + (phBalance?.level || 7).toFixed(1)"
          [attr.aria-describedby]="'acidify-description'"
          [attr.aria-pressed]="false">
          <span aria-hidden="true">Acidify (+0.6)</span>
          <span id="acidify-description" class="sr-only">
            {{ (phBalance?.level || 7) <= 1 ? 'Cannot acidify further - pH too low' : 'Decrease pH towards acidic range' }}
          </span>
        </button>
        <button 
          class="ph-adjust neutralize" 
          type="button"
          (click)="onNeutralize()"
          [disabled]="!canAdjustPH || (phBalance?.level || 7) >= 13"
          [attr.aria-label]="'Raise pH by 0.5 points. Current pH: ' + (phBalance?.level || 7).toFixed(1)"
          [attr.aria-describedby]="'neutralize-description'"
          [attr.aria-pressed]="false">
          <span aria-hidden="true">Neutralize (+0.5)</span>
          <span id="neutralize-description" class="sr-only">
            {{ (phBalance?.level || 7) >= 13 ? 'Cannot neutralize further - pH too high' : 'Increase pH towards neutral range' }}
          </span>
        </button>
      </div>
    </section>
  `,
  styleUrl: './ph-balance-system.component.scss'
})
export class PhBalanceSystemComponent {
  @Input() phBalance: PHBalanceMechanics | null = null;
  @Input() canAdjustPH: boolean = true;
  @Input() canStartFermentation: boolean = false;

  @Output() phAdjusted = new EventEmitter<number>();
  @Output() fermentationStarted = new EventEmitter<void>();

  // Component initialization state

  constructor(private cdr: ChangeDetectorRef) {}

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