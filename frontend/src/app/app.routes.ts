import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/candy-factory',
    pathMatch: 'full'
  },
  {
    path: 'candy-factory',
    loadComponent: () => import('./pages/candy-factory/candy-factory.component').then(m => m.CandyFactoryComponent)
    // Temporarily disabled auth guard for testing: canActivate: [AuthGuard]
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
    redirectTo: '/candy-factory'
  }
];
