import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/candy-factory',
    pathMatch: 'full'
  },
  {
    path: 'candy-factory',
    loadComponent: () => import('./pages/candy-factory/candy-factory.component').then(m => m.CandyFactoryComponent)
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'health',
    loadComponent: () => import('./pages/health/health.component').then(m => m.HealthComponent)
  }
];
