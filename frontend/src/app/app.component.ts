import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule, Router, NavigationEnd } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService, UserInfo } from './services/auth.service';
import { CandyFactoryService } from './services/candy-factory.service';
import { LoginComponent } from './components/login/login.component';
import { environment } from '../environments/environment';

interface AppInfo {
  name: string;
  version: string;
  environment: string;
  apiUrl: string;
}

interface HealthStatus {
  status: string;
  timestamp: string;
  database: string;
  version: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, HttpClientModule, LoginComponent],
  template: `
    <div class="app-container" [class.fullscreen-game]="isFullscreenRoute">
      <!-- Hide both headers on planet routes - planet components have their own unified headers -->
      <header class="app-header" *ngIf="!isPlanetRoute">
        <h1>{{ appInfo.name }}</h1>
        <div class="app-info">
          <span class="version">v{{ appInfo.version }}</span>
          <span class="environment" [class]="appInfo.environment">{{ appInfo.environment }}</span>
          <div class="user-info" *ngIf="currentUser">
            <span>Welcome, {{ currentUser.firstName }}!</span>
            <button (click)="logout()" class="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <!-- Hide navigation on planet routes - planet components have their own unified navigation -->
      <nav class="app-nav compact-nav" *ngIf="showNavigation && !isPlanetRoute">
        <!-- Planet Navigation Section -->
        <div class="nav-section">
          <!-- Solar System hub only useful when multiple planets exist -->
          <a routerLink="/solar-system" 
             routerLinkActive="active" 
             *ngIf="unlockedPlanets.length >= 3">🌌</a>
          
          <!-- Progressive planet navigation -->
          <div class="planet-nav">
            <a *ngFor="let planet of cachedPlanetNavItems" 
               [routerLink]="planet.route" 
               routerLinkActive="active">
              {{planet.icon}}
            </a>
          </div>
        </div>
        
        <!-- Integrated Currency Display -->
        <div class="nav-currency" *ngIf="gameState">
          <div class="currency-item">
            <span class="currency-icon">🍬</span>
            <span class="currency-value">{{ formatNumber(gameState.candy || 0) }}</span>
          </div>
          <div class="currency-item">
            <span class="currency-icon">💎</span>
            <span class="currency-value">{{ formatNumber(gameState.crystals || 0) }}</span>
          </div>
        </div>
        
        <!-- Utility links -->
        <div class="nav-utilities">
          <a routerLink="/health" routerLinkActive="active">⚕️</a>
        </div>
      </nav>

      <main class="app-main" [class.fullscreen-main]="isFullscreenRoute">
        <router-outlet></router-outlet>
      </main>

      
      <app-login (loginSuccess)="onLoginSuccess()"></app-login>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .app-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .app-header h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 300;
    }

    .app-info {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .logout-btn {
      padding: 0.25rem 0.75rem;
      background: rgba(255,255,255,0.2);
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 0.25rem;
      font-size: 0.875rem;
      cursor: pointer;
      transition: background 0.3s ease;
    }

    .logout-btn:hover {
      background: rgba(255,255,255,0.3);
    }

    .version {
      background: rgba(255,255,255,0.2);
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.875rem;
    }

    .environment {
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .environment.production {
      background: #28a745;
      color: white;
    }

    .environment.development {
      background: #ffc107;
      color: #212529;
    }

    .app-nav {
      background: #f8f9fa;
      padding: 0 2rem;
      border-bottom: 1px solid #dee2e6;
      display: flex;
      align-items: center;
      gap: 2rem;
      flex-wrap: wrap;
      position: relative;
      z-index: 1000;
      min-height: 48px; /* Reduced from default */
    }
    
    .compact-nav {
      padding: 0.25rem 2rem;
      min-height: 40px;
      justify-content: space-between;
    }
    
    .nav-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .nav-currency {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.9rem;
      font-weight: 600;
    }
    
    .currency-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      background: rgba(102, 126, 234, 0.1);
      border-radius: 0.25rem;
    }
    
    .currency-icon {
      font-size: 1rem;
    }
    
    .currency-value {
      color: #495057;
      font-weight: 600;
    }
    
    .nav-utilities {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .app-nav a {
      padding: 1rem 0;
      text-decoration: none;
      color: #495057;
      font-weight: 500;
      border-bottom: 3px solid transparent;
      transition: all 0.3s ease;
      white-space: nowrap;
    }

    .app-nav a:hover {
      color: #667eea;
      border-bottom-color: rgba(102, 126, 234, 0.3);
    }

    .app-nav a.active {
      color: #667eea;
      border-bottom-color: #667eea;
    }

    .planet-nav {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    
    .compact-nav .planet-nav a {
      padding: 0.375rem 0.75rem;
      margin: 0;
      border-radius: 0.375rem;
      border-bottom: none;
      background: rgba(102, 126, 234, 0.1);
      font-size: 1.1rem;
      transition: all 0.2s ease;
      min-width: auto;
    }

    .nav-section {
      color: #6c757d;
      font-weight: 600;
      font-size: 0.9rem;
      margin-right: 0.5rem;
    }

    .planet-nav a {
      padding: 0.5rem 0.75rem;
      margin: 0;
      border-radius: 0.5rem;
      border-bottom: none;
      background: rgba(102, 126, 234, 0.1);
      font-size: 0.9rem;
      transition: all 0.2s ease;
    }

    .planet-nav a:hover {
      background: rgba(102, 126, 234, 0.2);
      transform: translateY(-1px);
      border-bottom: none;
    }

    .planet-nav a.active {
      background: #667eea;
      color: white;
      border-bottom: none;
    }

    .app-main {
      flex: 1;
      width: 100%;
      box-sizing: border-box;
      position: relative;
      z-index: 1;
    }

    .fullscreen-game {
      height: 100vh;
      overflow: hidden;
    }

    .fullscreen-main {
      height: 100vh;
      width: 100vw;
      position: relative;
    }


    @media (max-width: 768px) {
      .app-header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .app-nav {
        flex-wrap: wrap;
        gap: 1rem;
      }

      .app-main {
        padding: 1rem;
      }

    }
  `]
})
export class AppComponent implements OnInit {
  appInfo: AppInfo = {
    name: '🍭 Cosmic Candy Factory',
    version: '1.0.0',
    environment: 'production',
    apiUrl: '/api/app1'
  };

  isFullscreenRoute = false;
  isPlanetRoute = false; // Track if current route is a planet route
  currentUser: UserInfo | null = null;
  unlockedPlanets: string[] = ['sweet']; // Start with only Sweet Planet unlocked
  showNavigation = false; // Cache navigation display state
  cachedPlanetNavItems: Array<{id: string, icon: string, name: string, route: string}> = [];
  gameState: any = null; // Current game state for currency display

  constructor(
    private http: HttpClient, 
    private router: Router,
    private authService: AuthService,
    private candyFactoryService: CandyFactoryService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    // Subscribe to game state changes for planet unlocking
    this.subscribeToGameStateForPlanetUnlocks();
  }

  ngOnInit(): void {
    // Load app configuration from environment or API
    this.loadAppInfo();
    
    // Subscribe to authentication state changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    
    // Subscribe to game state changes for currency display
    this.candyFactoryService.gameState$.subscribe(state => {
      this.gameState = state;
    });
    
    // Listen for route changes to determine fullscreen state and planet route state
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateFullscreenState(event.url);
        this.updatePlanetRouteState(event.url);
      });
      
    // Set initial fullscreen state and planet route state
    this.updateFullscreenState(this.router.url);
    this.updatePlanetRouteState(this.router.url);
    
    // Initialize planet navigation cache
    this.updatePlanetNavCache();
    
    // TODO: Load actual planet unlock progress from game state
    // Planets unlock based on game progression, not time
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }

  formatNumber(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    } else {
      return value.toString();
    }
  }

  onLoginSuccess(): void {
    // User successfully logged in - router will handle navigation
    console.log('Login successful for Cosmic Candy Factory!');
  }

  private isGameRoute(url: string): boolean {
    // Determine if route should be fullscreen based on URL only
    const gameRoutes = [
      '/',
      '/planet/sweet',
      '/planet/sour',
      '/planet/cold',
      '/planet/spicy',
      '/planet/bitter',
      '/planet/fizzy',
      '/candy-factory' // Legacy route
    ];
    
    const isGameRoute = gameRoutes.some(route => url === route || url.startsWith(route + '?') || url.startsWith(route + '#'));
    
    // Solar System is always fullscreen when accessed
    if (url.includes('/solar-system')) {
      return true;
    }
    
    return isGameRoute;
  }
  
  private updatePlanetNavCache(): void {
    const allPlanets = [
      { id: 'sweet', icon: '🍭', name: 'Sweet', route: '/planet/sweet' },
      { id: 'sour', icon: '🍋', name: 'Sour', route: '/planet/sour' },
      { id: 'cold', icon: '🧊', name: 'Cold', route: '/planet/cold' },
      { id: 'spicy', icon: '🌶️', name: 'Spicy', route: '/planet/spicy' },
      { id: 'bitter', icon: '☕', name: 'Bitter', route: '/planet/bitter' },
      { id: 'fizzy', icon: '🥤', name: 'Fizzy', route: '/planet/fizzy' }
    ];
    
    this.cachedPlanetNavItems = allPlanets.filter(planet => this.unlockedPlanets.includes(planet.id));
  }

  private loadAppInfo(): void {
    // Load from environment configuration
    this.appInfo = {
      ...this.appInfo,
      environment: environment.production ? 'production' : 'development',
      apiUrl: environment.apiUrl
    };
  }

  private updateFullscreenState(url: string): void {
    // Only show fullscreen for game routes when navigation is hidden (single planet)
    this.isFullscreenRoute = this.isGameRoute(url) && !this.showNavigation;
  }
  
  private updatePlanetRouteState(url: string): void {
    // Check if current route is a planet route (starts with /planet/)
    this.isPlanetRoute = url.startsWith('/planet/');
  }
  
  private subscribeToGameStateForPlanetUnlocks(): void {
    // Subscribe to game state changes to monitor planet unlock thresholds
    this.candyFactoryService.gameState$.subscribe(gameState => {
      const currentUnlockedCount = this.unlockedPlanets.length;
      
      // Check unlock thresholds based on totalCandyEarned
      if (gameState.totalCandyEarned >= 10000 && !this.unlockedPlanets.includes('sour')) {
        // Unlock Sour Planet at 10,000 total candy
        this.unlockedPlanets.push('sour');
        this.updatePlanetNavCache();
        
        // Show navigation when we have multiple planets
        if (this.unlockedPlanets.length >= 2) {
          this.showNavigation = true;
          this.updateFullscreenState(this.router.url);
        }
        
        console.log('🍋 Sour Planet unlocked! Navigate between planets using the menu above.');
      }
      
      // Future unlock thresholds can be added here
      // Cold Planet: 50,000 candy
      // Spicy Planet: 250,000 candy
      // etc.
    });
  }

}
