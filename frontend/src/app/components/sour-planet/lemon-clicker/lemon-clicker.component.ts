/**
 * LemonClickerComponent - Central Lemon Clicking Interface
 * 
 * Features:
 * - Central lemon visual with glow effect
 * - Click detection and visual feedback
 * - Floating number animations
 * - Click instruction text
 * - Responsive lemon sizing
 */

import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FloatingNumber {
  x: number;
  y: number;
  value: number;
  color: string;
  id: number;
}

interface ClickEvent {
  x: number;
  y: number;
  value: number;
  timestamp: number;
}

@Component({
  selector: 'app-lemon-clicker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Central Lemon Illustration (Design Guide Focal Point) -->
    <section class="central-lemon-section" aria-labelledby="lemon-clicker-heading">
      <div class="lemon-container" role="img" [attr.aria-label]="'Sour lemon with ' + (isOptimalPh ? 'optimal' : 'suboptimal') + ' glow effect'">
        <img 
          src="lemon.png" 
          alt="Sour Lemon" 
          class="central-lemon-illustration"
          [class.optimal-glow]="isOptimalPh"
          role="presentation">
        
        <div class="lemon-glow-effect" 
             [class.optimal]="isOptimalPh"
             [class.suboptimal]="!isOptimalPh"
             role="presentation"
             [attr.aria-hidden]="true"></div>
        
        <button 
          class="candy-button sour-candy" 
          (click)="onLemonClick($event)"
          [disabled]="disabled"
          type="button"
          role="button"
          [attr.aria-label]="'Click lemon to produce ' + clickPower + ' sour candy. Current pH modifier: ' + (phModifier * 100 | number:'1.0-0') + '%'"
          [attr.aria-describedby]="'lemon-click-instructions'"
          [attr.aria-pressed]="showClickEffect"
          #lemonButton>
          <div class="click-effect" *ngIf="showClickEffect" role="presentation" aria-hidden="true"></div>
        </button>
      </div>
      
      <div class="candy-clicker" role="region" aria-labelledby="lemon-clicker-heading">
        <h3 id="lemon-clicker-heading" class="sr-only">Lemon Clicking Interface</h3>
        <p id="lemon-click-instructions" class="click-instruction">{{ instructionText }}</p>
        <div class="click-power" *ngIf="clickPower > 1" role="status" aria-live="polite">
          <span class="sr-only">Current click power is </span>Power: {{ clickPower }}x
        </div>
      </div>
    </section>

    <!-- Floating Numbers -->
    <div class="floating-numbers" 
         role="region" 
         aria-label="Click feedback animations" 
         aria-live="polite" 
         aria-atomic="false"
         #floatingContainer>
      <div 
        *ngFor="let number of floatingNumbers; trackBy: trackFloatingNumber" 
        class="floating-number"
        role="status"
        [attr.aria-label]="'Gained ' + formatNumber(number.value) + ' sour candy'"
        [style.left.px]="number.x"
        [style.top.px]="number.y"
        [style.color]="number.color">
        +{{ formatNumber(number.value) }}
      </div>
    </div>
  `,
  styleUrl: './lemon-clicker.component.scss'
})
export class LemonClickerComponent implements OnDestroy {
  @Input() clickPower: number = 1;
  @Input() phModifier: number = 1.0;
  @Input() disabled: boolean = false;
  @Input() isOptimalPh: boolean = false;
  @Input() instructionText: string = 'Click the lemon to make sour candy!';

  @Output() candyClicked = new EventEmitter<ClickEvent>();

  showClickEffect = false;
  floatingNumbers: FloatingNumber[] = [];
  private nextFloatingId = 0;
  private activeTimeouts: number[] = [];

  ngOnDestroy(): void {
    // Clean up any active timeouts
    this.activeTimeouts.forEach(timeout => clearTimeout(timeout));
    this.activeTimeouts = [];
  }

  /**
   * Handle lemon click event
   */
  onLemonClick(event: MouseEvent): void {
    if (this.disabled) return;

    const actualGain = Math.floor(this.clickPower * this.phModifier);
    
    // Get click position relative to the viewport
    const rect = (event.target as Element).getBoundingClientRect();
    const clickX = event.clientX;
    const clickY = event.clientY;
    
    // Add floating number animation
    this.addFloatingNumber(clickX, clickY, actualGain);
    
    // Show click effect
    this.showClickEffect = true;
    const effectTimeout = setTimeout(() => this.showClickEffect = false, 200);
    this.activeTimeouts.push(effectTimeout as any);
    
    // Emit click event to parent
    this.candyClicked.emit({
      x: clickX,
      y: clickY,
      value: actualGain,
      timestamp: Date.now()
    });
  }

  /**
   * Add floating number animation
   */
  private addFloatingNumber(x: number, y: number, value: number): void {
    const floatingNumber: FloatingNumber = {
      x: x - 50, // Center on click
      y: y - 20,
      value,
      color: this.isOptimalPh ? '#32CD32' : '#FF6B6B',
      id: this.nextFloatingId++
    };
    
    this.floatingNumbers.push(floatingNumber);
    
    // Remove after animation completes
    const removeTimeout = setTimeout(() => {
      const index = this.floatingNumbers.findIndex(n => n.id === floatingNumber.id);
      if (index > -1) {
        this.floatingNumbers.splice(index, 1);
      }
    }, 2000);
    
    this.activeTimeouts.push(removeTimeout as any);
  }

  /**
   * Format numbers with K/M/B suffixes
   */
  formatNumber(value: number): string {
    if (value >= 1000000000) return (value / 1000000000).toFixed(1) + 'B';
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return Math.floor(value).toString();
  }

  /**
   * Track floating numbers for ngFor performance
   */
  trackFloatingNumber(index: number, item: FloatingNumber): number {
    return item.id;
  }
}