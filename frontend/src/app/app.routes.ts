import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/planet/sweet',
    pathMatch: 'full'
  },
  {
    path: 'solar-system',
    loadComponent: () => import('./components/solar-system-overview/solar-system-overview.component').then(m => m.SolarSystemOverviewComponent)
    // Temporarily disabled auth guard for testing: canActivate: [AuthGuard]
  },
  {
    path: 'planet/sweet',
    loadComponent: () => import('./pages/candy-factory/candy-factory.component').then(m => m.CandyFactoryComponent)
    // Sweet planet (legacy candy factory) - temporarily disabled auth guard for testing: canActivate: [AuthGuard]
  },
  {
    path: 'planet/sour',
    loadComponent: () => import('./components/sour-planet/sour-planet.component').then(m => m.SourPlanetComponent)
    // Sour planet - specialized component with pH balance mechanics
    // Temporarily disabled auth guard for testing: canActivate: [AuthGuard]
  },
  {
    path: 'planet/cold',
    loadComponent: () => import('./components/cold-planet/cold-planet.component').then(m => m.ColdPlanetComponent)
    // Cold planet - specialized component with temperature & crystallization mechanics
    // Temporarily disabled auth guard for testing: canActivate: [AuthGuard]
  },
  {
    path: 'planet/spicy',
    loadComponent: () => import('./components/spicy-planet/spicy-planet.component').then(m => m.SpicyPlanetComponent)
    // Spicy planet - specialized component with heat engine mechanics
    // Temporarily disabled auth guard for testing: canActivate: [AuthGuard]
  },
  {
    path: 'planet/bitter',
    loadComponent: () => import('./pages/candy-factory/candy-factory.component').then(m => m.CandyFactoryComponent),
    data: { planetType: 'bitter' }
    // Bitter planet - will use same component initially, differentiate by route data
    // Temporarily disabled auth guard for testing: canActivate: [AuthGuard]
  },
  {
    path: 'planet/fizzy',
    loadComponent: () => import('./pages/candy-factory/candy-factory.component').then(m => m.CandyFactoryComponent),
    data: { planetType: 'fizzy' }
    // Fizzy planet - will use same component initially, differentiate by route data
    // Temporarily disabled auth guard for testing: canActivate: [AuthGuard]
  },
  {
    path: 'candy-factory',
    redirectTo: '/planet/sweet',
    pathMatch: 'full'
    // Legacy redirect for existing bookmarks/links
  },
  {
    path: 'health',
    loadComponent: () => import('./pages/health/health.component').then(m => m.HealthComponent)
    // Health page remains public
  },
  {
    path: 'access-denied',
    loadComponent: () => import('./pages/access-denied/access-denied.component').then(m => m.AccessDeniedComponent)
  },
  {
    path: '**',
    redirectTo: '/planet/sweet'
  }
];
