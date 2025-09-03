/**
 * FermentationPanelComponent - Fermentation System Controls
 * 
 * Features:
 * - Fermentation progress display
 * - Active fermentation status
 * - Start fermentation button
 * - Progress bar with percentage
 * - Production bonus information
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

@Component({
  selector: 'app-fermentation-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Fermentation System -->
    <div class="fermentation-panel" *ngIf="phBalance?.fermentationActive || showFermentationControls">
      <div class="fermentation-header">
        <h3 *ngIf="phBalance?.fermentationActive">🫙 Active Fermentation</h3>
        <h3 *ngIf="!phBalance?.fermentationActive">🫙 Fermentation System</h3>
        <div class="fermentation-progress" *ngIf="phBalance?.fermentationActive">
          {{ getFermentationPercentage() }}%
        </div>
      </div>
      
      <!-- Active Fermentation Progress -->
      <div *ngIf="phBalance?.fermentationActive" class="fermentation-active">
        <div class="progress-bar">
          <div class="progress-fill" 
               [style.width.%]="(phBalance?.fermentationProgress || 0) * 100"></div>
        </div>
        
        <p class="fermentation-description">
          Fermentation increases production by {{ getFermentationBonus() }}% when pH is optimal
        </p>
        
        <div class="fermentation-stats">
          <div class="stat-item">
            <span class="stat-label">Time Remaining:</span>
            <span class="stat-value">{{ getRemainingTime() }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Bonus:</span>
            <span class="stat-value">+{{ getFermentationBonus() }}%</span>
          </div>
        </div>
      </div>
      
      <!-- Fermentation Controls -->
      <div *ngIf="!phBalance?.fermentationActive" class="fermentation-controls">
        <p class="fermentation-description">
          Start fermentation to boost production when pH is in optimal range (4.0-6.5)
        </p>
        
        <button 
          class="fermentation-btn" 
          (click)="onStartFermentation()" 
          [disabled]="!canStartFermentation"
          [attr.aria-label]="getStartButtonLabel()">
          <img src="/beaker.png" alt="Beaker" class="btn-icon-img">
          <span class="btn-text">Start Fermentation</span>
        </button>
        
        <div class="fermentation-requirements" *ngIf="!canStartFermentation">
          <small class="requirement-text">
            ⚠️ Requires optimal pH range (4.0-6.5) to start fermentation
          </small>
        </div>
      </div>
    </div>
  `,
  styleUrl: './fermentation-panel.component.scss'
})
export class FermentationPanelComponent {
  @Input() phBalance: PHBalanceMechanics | null = null;
  @Input() canStartFermentation: boolean = false;
  @Input() showFermentationControls: boolean = true;

  @Output() fermentationStarted = new EventEmitter<void>();

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
   * Get start button accessibility label
   */
  getStartButtonLabel(): string {
    if (!this.canStartFermentation) {
      return 'Cannot start fermentation - pH must be in optimal range (4.0-6.5)';
    }
    return 'Start fermentation process to boost production by up to 50%';
  }

  /**
   * Handle start fermentation button click
   */
  onStartFermentation(): void {
    if (!this.canStartFermentation) return;
    this.fermentationStarted.emit();
  }

  /**
   * Check if fermentation is currently active
   */
  get isFermentationActive(): boolean {
    return this.phBalance?.fermentationActive === true;
  }

  /**
   * Get fermentation status text
   */
  getFermentationStatusText(): string {
    if (!this.phBalance) return 'System offline';
    
    if (this.phBalance.fermentationActive) {
      const progress = this.getFermentationPercentage();
      if (progress < 25) return 'Fermentation starting...';
      if (progress < 50) return 'Fermentation active';
      if (progress < 75) return 'Fermentation progressing';
      if (progress < 100) return 'Fermentation nearly complete';
      return 'Fermentation complete!';
    }
    
    return this.canStartFermentation ? 'Ready to ferment' : 'pH adjustment needed';
  }
}