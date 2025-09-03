/**
 * CurrencyDisplayComponent - Top Bar Currency and Production Stats
 * 
 * Displays:
 * - Sour candy count with icon
 * - Crystals count (future feature)
 * - Production rate per second
 * - Menu icon (future feature)
 */

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-currency-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Top Bar Currency Display (Design Guide Compliant) -->
    <div class="top-bar">
      <!-- Left Side: Currency Display -->
      <div class="currency-display">
        <div class="currency-item sour-candy">
          <img src="/sour_candy.png" alt="Sour Candy" class="currency-icon">
          <span class="currency-value">{{ formatNumber(candy) }}</span>
          <span class="currency-label">sour candy</span>
        </div>
        
        <div class="currency-item crystals">
          <img src="/crystals.png" alt="Crystals" class="currency-icon">
          <span class="currency-value">{{ formatNumber(crystals) }}</span>
          <span class="currency-label">Crystals</span>
        </div>
        
        <div class="empty-space"></div>
      </div>
      
      <!-- Right Side: Production Rate -->
      <div class="production-rate">
        <img src="/gears.png" alt="Production Rate" class="production-icon">
        <span class="production-label">Production Rate</span>
        <span class="production-value">{{ formatNumber(productionPerSecond) }}/sec</span>
        <div class="menu-icon">☰</div>
      </div>
    </div>
  `,
  styleUrl: './currency-display.component.scss'
})
export class CurrencyDisplayComponent {
  @Input() candy: number = 0;
  @Input() crystals: number = 0;
  @Input() productionPerSecond: number = 0;

  /**
   * Format large numbers with K/M/B suffixes
   */
  formatNumber(value: number): string {
    if (value >= 1000000000) return (value / 1000000000).toFixed(1) + 'B';
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return Math.floor(value).toString();
  }
}