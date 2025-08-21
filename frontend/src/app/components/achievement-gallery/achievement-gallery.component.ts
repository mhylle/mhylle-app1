import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { AchievementService } from '../../services/achievement.service';
import { CandyFactoryService } from '../../services/candy-factory.service';
import { 
  Achievement, 
  CollectibleCandy, 
  CollectionStats,
  GameState
} from '../../models/candy-factory.interface';

@Component({
  selector: 'app-achievement-gallery',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="achievement-gallery-overlay" (click)="closeGallery()">
      <div class="achievement-gallery" (click)="$event.stopPropagation()">
        <!-- Header with tabs -->
        <div class="gallery-header">
          <h2>🏆 Achievement Gallery</h2>
          <div class="gallery-tabs">
            <button 
              class="tab-btn" 
              [class.active]="activeTab === 'achievements'"
              (click)="activeTab = 'achievements'">
              Achievements
            </button>
            <button 
              class="tab-btn" 
              [class.active]="activeTab === 'collection'"
              (click)="activeTab = 'collection'">
              Collection
            </button>
          </div>
          <button class="close-btn" (click)="closeGallery()">✕</button>
        </div>

        <!-- Achievement Stats -->
        <div class="gallery-stats">
          <div class="stat-item">
            <span class="stat-label">Progress:</span>
            <span class="stat-value">{{getCompletionPercentage().toFixed(1)}}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Unlocked:</span>
            <span class="stat-value">{{getUnlockedCount()}} / {{getTotalCount()}}</span>
          </div>
          <div class="stat-item" *ngIf="activeTab === 'collection'">
            <span class="stat-label">Collection:</span>
            <span class="stat-value">{{(collectionStats$ | async)?.totalDiscovered || 0}} candies</span>
          </div>
        </div>

        <!-- Achievements Tab -->
        <div class="gallery-content" *ngIf="activeTab === 'achievements'">
          <!-- Category Filter -->
          <div class="category-filters">
            <button 
              *ngFor="let category of categories" 
              class="filter-btn"
              [class.active]="selectedCategory === category"
              (click)="selectedCategory = category">
              {{getCategoryName(category)}}
            </button>
          </div>

          <!-- Achievements Grid -->
          <div class="achievements-grid">
            <div 
              *ngFor="let achievement of getFilteredAchievements()" 
              class="achievement-card"
              [class.unlocked]="achievement.unlocked"
              [class.hidden-achievement]="achievement.hidden && !achievement.unlocked"
              [style.border-color]="getRarityColor(achievement.rarity)">
              
              <div class="achievement-icon" 
                   [style.text-shadow]="achievement.unlocked ? '0 0 10px ' + getRarityColor(achievement.rarity) : ''">
                {{achievement.unlocked || !achievement.hidden ? achievement.icon : '❓'}}
              </div>
              
              <div class="achievement-info">
                <div class="achievement-name" 
                     [style.color]="achievement.unlocked ? getRarityColor(achievement.rarity) : ''">
                  {{achievement.unlocked || !achievement.hidden ? achievement.name : '???'}}
                </div>
                <div class="achievement-description">
                  {{achievement.unlocked || !achievement.hidden ? achievement.description : 'Hidden achievement'}}
                </div>
                <div class="achievement-rarity" [style.color]="getRarityColor(achievement.rarity)">
                  {{achievement.rarity.toUpperCase()}}
                </div>
              </div>
              
              <div class="achievement-progress" *ngIf="!achievement.unlocked && (!achievement.hidden || achievement.progress > 0)">
                <div class="progress-bar">
                  <div class="progress-fill" 
                       [style.width.%]="(achievement.progress / achievement.maxProgress) * 100"
                       [style.background-color]="getRarityColor(achievement.rarity)">
                  </div>
                </div>
                <div class="progress-text">
                  {{achievement.progress}} / {{achievement.maxProgress}}
                </div>
              </div>
              
              <div class="achievement-unlocked-date" *ngIf="achievement.unlocked && achievement.unlockedAt">
                Unlocked: {{formatDate(achievement.unlockedAt)}}
              </div>
            </div>
          </div>
        </div>

        <!-- Collection Tab -->
        <div class="gallery-content" *ngIf="activeTab === 'collection'">
          <!-- Rarity Filter -->
          <div class="rarity-filters">
            <button 
              *ngFor="let rarity of rarities" 
              class="filter-btn"
              [class.active]="selectedRarity === rarity"
              (click)="selectedRarity = rarity"
              [style.color]="getRarityColor(rarity)">
              {{rarity.charAt(0).toUpperCase() + rarity.slice(1)}}
            </button>
          </div>

          <!-- Collection Stats Breakdown -->
          <div class="collection-breakdown" *ngIf="collectionStats$ | async as stats">
            <div class="rarity-stat" *ngFor="let rarity of rarities">
              <span class="rarity-name" [style.color]="getRarityColor(rarity)">
                {{rarity.charAt(0).toUpperCase() + rarity.slice(1)}}:
              </span>
              <span class="rarity-count">{{getRarityCount(stats, rarity)}}</span>
            </div>
          </div>

          <!-- Candies Grid -->
          <div class="candies-grid">
            <div 
              *ngFor="let candy of getFilteredCandies()" 
              class="candy-card"
              [class.discovered]="isDiscovered(candy.id)"
              [style.border-color]="getRarityColor(candy.rarity)"
              [style.box-shadow]="isDiscovered(candy.id) ? '0 0 15px ' + getRarityGlow(candy.rarity) : ''">
              
              <div class="candy-icon" 
                   [style.color]="candy.color"
                   [style.text-shadow]="isDiscovered(candy.id) ? '0 0 10px ' + candy.color : ''">
                {{isDiscovered(candy.id) ? candy.icon : '❓'}}
              </div>
              
              <div class="candy-info">
                <div class="candy-name" [style.color]="getRarityColor(candy.rarity)">
                  {{isDiscovered(candy.id) ? candy.name : '???'}}
                </div>
                <div class="candy-description">
                  {{isDiscovered(candy.id) ? candy.description : 'Undiscovered candy'}}
                </div>
                <div class="candy-rarity" [style.color]="getRarityColor(candy.rarity)">
                  {{candy.rarity.toUpperCase()}}
                </div>
                <div class="candy-source">
                  Source: {{candy.source.replace('_', ' ')}}
                </div>
              </div>
              
              <div class="candy-count" *ngIf="isDiscovered(candy.id)">
                <span class="count-label">Collected:</span>
                <span class="count-value">{{getCollectedCount(candy.id)}}</span>
              </div>
              
              <div class="candy-bonuses" *ngIf="isDiscovered(candy.id) && candy.passiveBonuses.length > 0">
                <div class="bonus-title">Passive Bonuses:</div>
                <div class="bonus-item" *ngFor="let bonus of candy.passiveBonuses">
                  {{bonus.description}}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Achievements Popup -->
        <div class="recent-achievements" *ngIf="recentlyUnlocked$ | async as recent">
          <div class="recent-popup" *ngFor="let achievement of recent">
            <div class="popup-header">🎉 Achievement Unlocked!</div>
            <div class="popup-icon">{{achievement.icon}}</div>
            <div class="popup-name" [style.color]="getRarityColor(achievement.rarity)">
              {{achievement.name}}
            </div>
            <div class="popup-description">{{achievement.description}}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./achievement-gallery.component.css']
})
export class AchievementGalleryComponent implements OnInit, OnDestroy {
  achievements$: Observable<Achievement[]>;
  recentlyUnlocked$: Observable<Achievement[]>;
  collectionStats$: Observable<CollectionStats>;
  discoveredCandies$: Observable<CollectibleCandy[]>;
  
  activeTab: 'achievements' | 'collection' = 'achievements';
  selectedCategory: string = 'all';
  selectedRarity: string = 'all';
  
  categories = ['all', 'production', 'clicking', 'collection', 'prestige', 'discovery', 'secret'];
  rarities = ['all', 'common', 'rare', 'epic', 'legendary', 'mythic'];
  
  private gameState: GameState;
  private subscription = new Subscription();

  @Output() closeGalleryEvent = new EventEmitter<void>();

  constructor(
    private achievementService: AchievementService,
    private candyFactoryService: CandyFactoryService
  ) {
    this.achievements$ = this.achievementService.achievements$;
    this.recentlyUnlocked$ = this.achievementService.recentlyUnlocked$;
    this.collectionStats$ = this.achievementService.collectionStats$;
    this.discoveredCandies$ = this.achievementService.discoveredCandies$;
    
    this.gameState = this.candyFactoryService.currentGameState;
  }

  ngOnInit(): void {
    this.subscription.add(
      this.candyFactoryService.gameState$.subscribe(state => {
        this.gameState = state;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  closeGallery(): void {
    this.closeGalleryEvent.emit();
  }

  getFilteredAchievements(): Achievement[] {
    // Get current achievements from the service
    let achievements: Achievement[] = [];
    
    // Subscribe to get the current achievements
    const subscription = this.achievementService.achievements$.subscribe(current => {
      achievements = current;
    });
    subscription.unsubscribe(); // Immediately unsubscribe since we just want current value
    
    
    // Filter by category
    if (this.selectedCategory !== 'all') {
      achievements = achievements.filter(achievement => 
        achievement.category === this.selectedCategory
      );
    }
    
    
    return achievements;
  }

  getFilteredCandies(): CollectibleCandy[] {
    let candies = this.achievementService.getAllCandies();
    
    if (this.selectedRarity !== 'all') {
      candies = candies.filter(candy => candy.rarity === this.selectedRarity);
    }
    
    return candies;
  }

  getCategoryName(category: string): string {
    const names: { [key: string]: string } = {
      'all': 'All',
      'production': 'Production',
      'clicking': 'Clicking',
      'collection': 'Collection',
      'prestige': 'Prestige',
      'discovery': 'Discovery',
      'secret': 'Secret'
    };
    return names[category] || category;
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

  isDiscovered(candyId: string): boolean {
    return this.gameState.discoveredCandies.includes(candyId);
  }

  getCollectedCount(candyId: string): number {
    return this.gameState.collectedCandies[candyId]?.count || 0;
  }

  getCompletionPercentage(): number {
    return this.achievementService.getCompletionPercentage();
  }

  getUnlockedCount(): number {
    return this.achievementService.getTotalAchievementPoints();
  }

  getTotalCount(): number {
    // This should get total non-hidden achievements
    return 20; // Placeholder
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString();
  }

  getRarityCount(stats: CollectionStats, rarity: string): number {
    if (rarity === 'all') return stats.totalDiscovered;
    
    const rarityKey = rarity as keyof typeof stats.rarityBreakdown;
    return stats.rarityBreakdown[rarityKey] || 0;
  }
}