/**
 * PlanetHeaderComponent - Unified Header for All Planet Interfaces
 * 
 * Features:
 * - Unified navigation bar with back button and breadcrumbs
 * - Integrated resource display with candy counter and production rate
 * - Planet branding with name and scientific subtitle
 * - Cross-planet theme compatibility (Sour/Sweet/Cold/Spicy)
 * - Responsive design for mobile and desktop
 * - Laboratory aesthetic with scientific elements
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

export interface PlanetTheme {
  id: 'sour' | 'sweet' | 'cold' | 'spicy';
  name: string;
  subtitle: string;
  emoji: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundIcon: string;
  labEquipment: string[];
}

export interface ResourceData {
  candy: number;
  crystals?: number;
  productionPerSecond: number;
  specialResources?: { [key: string]: number };
}

export interface PlanetNavItem {
  id: string;
  name: string;
  icon: string;
  route: string;
  unlocked: boolean;
}

@Component({
  selector: 'app-planet-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="planet-header" [attr.data-theme]="theme.id">
      <!-- Background Pattern -->
      <div class="header-background">
        <div class="lab-pattern" [style.background-image]="'url(' + theme.backgroundIcon + ')'"></div>
        <div class="animated-scan"></div>
      </div>
      
      <!-- Header Content -->
      <div class="header-content">
        <!-- Logo on the left -->
        <div class="logo-section">
          <img src="/logo.png" alt="Cosmic Candy Factory Logo" class="game-logo">
        </div>

        <!-- Navigation Section with Planet Switcher -->
        <div class="navigation-section">
          <!-- Planet Navigation (if more than one planet unlocked) -->
          <div class="planet-nav" *ngIf="planets && planets.length > 1">
            <a *ngFor="let planet of planets" 
               [routerLink]="planet.route"
               [class.active]="planet.id === currentPlanetId"
               [class.locked]="!planet.unlocked"
               [attr.title]="planet.name + (planet.unlocked ? '' : ' (Locked)')"
               [attr.aria-label]="'Navigate to ' + planet.name">
              {{ planet.icon }}
            </a>
          </div>
          
          <!-- Back to Solar System button (if showing planet nav) -->
          <button 
            *ngIf="planets && planets.length >= 3"
            class="back-button solar-system-btn"
            routerLink="/solar-system"
            [attr.aria-label]="'Back to Solar System'"
            type="button">
            <span class="lab-icon">🌌</span>
            <span class="button-text">Solar System</span>
          </button>
          
          <!-- Simple back button (if only one planet or no nav) -->
          <button 
            *ngIf="!planets || planets.length <= 2"
            class="back-button"
            (click)="onBackClick()"
            [attr.aria-label]="'Back to Solar System'"
            type="button">
            <span class="lab-icon">🧪</span>
            <span class="button-text">{{ backButtonText }}</span>
          </button>
          
          <!-- Breadcrumb (optional) -->
          <nav class="breadcrumb" *ngIf="showBreadcrumb" aria-label="breadcrumb">
            <span class="breadcrumb-item">Solar System</span>
            <span class="breadcrumb-separator">→</span>
            <span class="breadcrumb-current">{{ theme.name }}</span>
          </nav>
        </div>

        <!-- Planet Branding -->
        <div class="planet-branding">
          <!-- Game Title -->
          <div class="game-title">
            <img src="/logo-text.png" alt="Cosmic Candy Factory" class="game-title-text">
          </div>
          
          <h1 class="planet-title">
            <span class="planet-emoji">{{ theme.emoji }}</span>
            <span class="planet-name">{{ theme.name }}</span>
          </h1>
          <div class="planet-subtitle">
            <span class="lab-equipment">{{ theme.labEquipment[0] }}</span>
            <span class="subtitle-text">{{ theme.subtitle }}</span>
            <span class="lab-equipment">{{ theme.labEquipment[1] }}</span>
          </div>
        </div>

        <!-- Primary Actions (optional slot) -->
        <div class="primary-actions" *ngIf="showPrimaryActions">
          <ng-content select="[slot=primary-actions]"></ng-content>
        </div>
      </div>

      <!-- Resource Display Section -->
      <div class="resource-section" *ngIf="resources">
        <!-- Main Currency Display -->
        <div class="currency-display">
          <div class="currency-item main-currency">
            <span class="currency-icon">🍭</span>
            <div class="currency-info">
              <span class="currency-amount">{{ formatNumber(resources.candy) }}</span>
              <span class="currency-label">Candy</span>
            </div>
          </div>

          <!-- Production Rate -->
          <div class="production-display" *ngIf="resources.productionPerSecond > 0">
            <span class="production-icon">⚡</span>
            <div class="production-info">
              <span class="production-rate">+{{ formatNumber(resources.productionPerSecond) }}/sec</span>
              <span class="production-label">Production</span>
            </div>
          </div>

          <!-- Crystals (if available) -->
          <div class="currency-item secondary-currency" *ngIf="resources.crystals && resources.crystals > 0">
            <span class="currency-icon">💎</span>
            <div class="currency-info">
              <span class="currency-amount">{{ formatNumber(resources.crystals) }}</span>
              <span class="currency-label">Crystals</span>
            </div>
          </div>

          <!-- Special Resources -->
          <div class="special-resources" *ngIf="resources.specialResources">
            <div 
              class="special-resource" 
              *ngFor="let resource of getSpecialResourcesArray()"
              [title]="resource.name">
              <span class="resource-icon">{{ resource.icon }}</span>
              <span class="resource-amount">{{ formatNumber(resource.value) }}</span>
            </div>
          </div>
        </div>

        <!-- Lab Equipment Background -->
        <div class="lab-equipment-bg">
          <span class="equipment-icon molecular">🧬</span>
        </div>
      </div>

      <!-- Quick Actions Bar (optional) -->
      <div class="quick-actions-bar" *ngIf="showQuickActions">
        <ng-content select="[slot=quick-actions]"></ng-content>
      </div>
    </div>
  `,
  styleUrl: './planet-header.component.scss'
})
export class PlanetHeaderComponent {
  @Input() theme: PlanetTheme = this.getDefaultTheme('sour');
  @Input() resources: ResourceData | null = null;
  @Input() backButtonText: string = 'Back to Solar System';
  @Input() showBreadcrumb: boolean = false;
  @Input() showPrimaryActions: boolean = false;
  @Input() showQuickActions: boolean = false;
  @Input() isLoading: boolean = false;
  @Input() planets: PlanetNavItem[] = [];
  @Input() currentPlanetId: string = '';

  @Output() backClicked = new EventEmitter<void>();
  @Output() resourceClicked = new EventEmitter<string>();
  @Output() planetSwitched = new EventEmitter<string>();

  constructor(private router: Router) {}

  /**
   * Handle back button click
   */
  onBackClick(): void {
    this.backClicked.emit();
  }

  /**
   * Format numbers for display
   */
  formatNumber(value: number): string {
    if (value >= 1000000000) return (value / 1000000000).toFixed(1) + 'B';
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return Math.floor(value).toString();
  }

  /**
   * Get special resources as array for template iteration
   */
  getSpecialResourcesArray(): Array<{name: string, icon: string, value: number}> {
    if (!this.resources?.specialResources) return [];
    
    return Object.entries(this.resources.specialResources).map(([key, value]) => ({
      name: key,
      icon: this.getResourceIcon(key),
      value: value
    }));
  }

  /**
   * Get icon for special resource types
   */
  private getResourceIcon(resourceType: string): string {
    const icons: { [key: string]: string } = {
      'ph': '🧪',
      'temperature': '🌡️',
      'spice': '🌶️',
      'sweetness': '🍯',
      'clickPower': '👆',
      'energy': '⚡',
      'materials': '🔧',
      'research': '🔬'
    };
    return icons[resourceType] || '📊';
  }

  /**
   * Get default theme configuration
   */
  private getDefaultTheme(planetType: 'sour' | 'sweet' | 'cold' | 'spicy'): PlanetTheme {
    const themes: { [key: string]: PlanetTheme } = {
      sour: {
        id: 'sour',
        name: 'Sour Planet',
        subtitle: 'pH Balance & Fermentation',
        emoji: '🍋',
        primaryColor: '#32CD32',
        secondaryColor: '#9ACD32',
        accentColor: '#FFD700',
        backgroundIcon: '/beaker.png',
        labEquipment: ['⚗️', '🧪']
      },
      sweet: {
        id: 'sweet',
        name: 'Sweet Planet',
        subtitle: 'Sugar Crystal Formation',
        emoji: '🍭',
        primaryColor: '#FF69B4',
        secondaryColor: '#FFB6C1',
        accentColor: '#FFC0CB',
        backgroundIcon: '/crystals.png',
        labEquipment: ['🍯', '🧊']
      },
      cold: {
        id: 'cold',
        name: 'Cold Planet',
        subtitle: 'Cryogenic Processing',
        emoji: '❄️',
        primaryColor: '#00BFFF',
        secondaryColor: '#87CEEB',
        accentColor: '#B0E0E6',
        backgroundIcon: '/molecular.png',
        labEquipment: ['🧊', '🌡️']
      },
      spicy: {
        id: 'spicy',
        name: 'Spicy Planet',
        subtitle: 'Heat Catalyst Systems',
        emoji: '🌶️',
        primaryColor: '#FF4500',
        secondaryColor: '#FF6347',
        accentColor: '#FFD700',
        backgroundIcon: '/gears.png',
        labEquipment: ['🔥', '🌡️']
      }
    };
    
    return themes[planetType];
  }

  /**
   * Static method to create theme configurations
   */
  static createTheme(planetType: 'sour' | 'sweet' | 'cold' | 'spicy', overrides?: Partial<PlanetTheme>): PlanetTheme {
    const themes: { [key: string]: PlanetTheme } = {
      sour: {
        id: 'sour',
        name: 'Sour Planet',
        subtitle: 'pH Balance & Fermentation',
        emoji: '🍋',
        primaryColor: '#32CD32',
        secondaryColor: '#9ACD32',
        accentColor: '#FFD700',
        backgroundIcon: '/beaker.png',
        labEquipment: ['⚗️', '🧪']
      },
      sweet: {
        id: 'sweet',
        name: 'Sweet Planet',
        subtitle: 'Sugar Crystal Formation',
        emoji: '🍭',
        primaryColor: '#FF69B4',
        secondaryColor: '#FFB6C1',
        accentColor: '#FFC0CB',
        backgroundIcon: '/crystals.png',
        labEquipment: ['🍯', '🧊']
      },
      cold: {
        id: 'cold',
        name: 'Cold Planet',
        subtitle: 'Cryogenic Processing',
        emoji: '❄️',
        primaryColor: '#00BFFF',
        secondaryColor: '#87CEEB',
        accentColor: '#B0E0E6',
        backgroundIcon: '/molecular.png',
        labEquipment: ['🧊', '🌡️']
      },
      spicy: {
        id: 'spicy',
        name: 'Spicy Planet',
        subtitle: 'Heat Catalyst Systems',
        emoji: '🌶️',
        primaryColor: '#FF4500',
        secondaryColor: '#FF6347',
        accentColor: '#FFD700',
        backgroundIcon: '/gears.png',
        labEquipment: ['🔥', '🌡️']
      }
    };
    
    const defaultTheme = themes[planetType];
    return { ...defaultTheme, ...overrides };
  }
}