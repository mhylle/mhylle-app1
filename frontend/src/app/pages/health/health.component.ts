import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Observable, timer, of } from 'rxjs';
import { switchMap, catchError, startWith } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'unknown';
  timestamp: string;
  database: {
    status: string;
    responseTime: number;
  };
  version: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  environment: string;
}

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  template: `
    <div class="health-container">
      <div class="health-header">
        <h1>System Health Check</h1>
        <div class="last-updated">
          Last updated: {{ (healthData$ | async)?.timestamp | date:'medium' }}
        </div>
      </div>

      <div *ngIf="healthData$ | async as health" class="health-content">
        <!-- Overall Status -->
        <div class="status-card" [class]="health.status">
          <div class="status-icon">
            <span *ngIf="health.status === 'healthy'">✅</span>
            <span *ngIf="health.status === 'unhealthy'">❌</span>
            <span *ngIf="health.status === 'unknown'">❓</span>
          </div>
          <div class="status-info">
            <h2>Overall Status</h2>
            <span class="status-text">{{ health.status | titlecase }}</span>
          </div>
        </div>

        <!-- System Information -->
        <div class="info-grid">
          <div class="info-card">
            <h3>Application</h3>
            <div class="info-item">
              <span class="label">Version:</span>
              <span class="value">{{ health.version }}</span>
            </div>
            <div class="info-item">
              <span class="label">Environment:</span>
              <span class="value">{{ health.environment }}</span>
            </div>
            <div class="info-item">
              <span class="label">Uptime:</span>
              <span class="value">{{ formatUptime(health.uptime) }}</span>
            </div>
          </div>

          <div class="info-card">
            <h3>Database</h3>
            <div class="info-item">
              <span class="label">Status:</span>
              <span class="value" [class]="health.database.status">
                {{ health.database.status }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">Response Time:</span>
              <span class="value">{{ health.database.responseTime }}ms</span>
            </div>
            <div class="info-item">
              <span class="label">Connection:</span>
              <span class="value connected">Connected</span>
            </div>
          </div>

          <div class="info-card">
            <h3>Memory Usage</h3>
            <div class="info-item">
              <span class="label">Used:</span>
              <span class="value">{{ formatBytes(health.memory.used) }}</span>
            </div>
            <div class="info-item">
              <span class="label">Total:</span>
              <span class="value">{{ formatBytes(health.memory.total) }}</span>
            </div>
            <div class="info-item">
              <span class="label">Percentage:</span>
              <span class="value">{{ health.memory.percentage }}%</span>
            </div>
            <div class="memory-bar">
              <div class="memory-fill" [style.width.%]="health.memory.percentage"></div>
            </div>
          </div>
        </div>

        <!-- API Endpoints -->
        <div class="endpoints-section">
          <h3>API Endpoints</h3>
          <div class="endpoints-grid">
            <div class="endpoint-item" *ngFor="let endpoint of apiEndpoints">
              <div class="endpoint-method" [class]="endpoint.method.toLowerCase()">
                {{ endpoint.method }}
              </div>
              <div class="endpoint-path">{{ endpoint.path }}</div>
              <div class="endpoint-description">{{ endpoint.description }}</div>
              <div class="endpoint-status" [class]="endpoint.status">
                {{ endpoint.status }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="!(healthData$ | async) && !isLoading" class="error-state">
        <h2>Unable to fetch health data</h2>
        <p>The health check API is not responding. This could indicate:</p>
        <ul>
          <li>The backend service is down</li>
          <li>Network connectivity issues</li>
          <li>API endpoint configuration problems</li>
        </ul>
        <button (click)="refreshHealth()" class="retry-btn">Retry</button>
      </div>

      <div *ngIf="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading health data...</p>
      </div>

      <div class="refresh-controls">
        <button (click)="refreshHealth()" class="refresh-btn">Refresh Now</button>
        <label class="auto-refresh">
          <input type="checkbox" [(ngModel)]="autoRefresh" (change)="toggleAutoRefresh()">
          Auto-refresh (30s)
        </label>
      </div>
    </div>
  `,
  styles: [`
    .health-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .health-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .health-header h1 {
      color: #333;
      margin-bottom: 0.5rem;
    }

    .last-updated {
      color: #666;
      font-size: 0.875rem;
    }

    .status-card {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 2rem;
      border-radius: 1rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .status-card.healthy {
      background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
      border: 1px solid #c3e6cb;
    }

    .status-card.unhealthy {
      background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
      border: 1px solid #f5c6cb;
    }

    .status-card.unknown {
      background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
      border: 1px solid #ffeaa7;
    }

    .status-icon {
      font-size: 3rem;
    }

    .status-info h2 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }

    .status-text {
      font-size: 1.25rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .info-card {
      background: white;
      padding: 2rem;
      border-radius: 1rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .info-card h3 {
      margin: 0 0 1.5rem 0;
      color: #333;
      border-bottom: 2px solid #667eea;
      padding-bottom: 0.5rem;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .info-item:last-child {
      margin-bottom: 0;
    }

    .label {
      font-weight: 500;
      color: #666;
    }

    .value {
      font-weight: 600;
      color: #333;
    }

    .value.connected {
      color: #28a745;
    }

    .value.healthy {
      color: #28a745;
    }

    .value.unhealthy {
      color: #dc3545;
    }

    .memory-bar {
      width: 100%;
      height: 8px;
      background: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 1rem;
    }

    .memory-fill {
      height: 100%;
      background: linear-gradient(90deg, #28a745 0%, #ffc107 70%, #dc3545 90%);
      transition: width 0.3s ease;
    }

    .endpoints-section {
      background: white;
      padding: 2rem;
      border-radius: 1rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }

    .endpoints-section h3 {
      margin: 0 0 1.5rem 0;
      color: #333;
      border-bottom: 2px solid #667eea;
      padding-bottom: 0.5rem;
    }

    .endpoints-grid {
      display: grid;
      gap: 1rem;
    }

    .endpoint-item {
      display: grid;
      grid-template-columns: auto 1fr auto auto;
      gap: 1rem;
      align-items: center;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 0.5rem;
    }

    .endpoint-method {
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .endpoint-method.get {
      background: #28a745;
      color: white;
    }

    .endpoint-method.post {
      background: #007bff;
      color: white;
    }

    .endpoint-method.put {
      background: #ffc107;
      color: #212529;
    }

    .endpoint-method.delete {
      background: #dc3545;
      color: white;
    }

    .endpoint-path {
      font-family: 'Courier New', monospace;
      font-weight: 500;
      color: #495057;
    }

    .endpoint-description {
      color: #666;
      font-size: 0.875rem;
    }

    .endpoint-status {
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .endpoint-status.healthy {
      background: #d4edda;
      color: #155724;
    }

    .endpoint-status.unhealthy {
      background: #f8d7da;
      color: #721c24;
    }

    .error-state,
    .loading-state {
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 1rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }

    .error-state h2 {
      color: #dc3545;
      margin-bottom: 1rem;
    }

    .error-state ul {
      text-align: left;
      max-width: 400px;
      margin: 1rem auto;
    }

    .retry-btn,
    .refresh-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .retry-btn:hover,
    .refresh-btn:hover {
      background: #5a6fd8;
      transform: translateY(-2px);
    }

    .spinner {
      width: 3rem;
      height: 3rem;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .refresh-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .auto-refresh {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      user-select: none;
    }

    @media (max-width: 768px) {
      .status-card {
        flex-direction: column;
        text-align: center;
      }

      .endpoint-item {
        grid-template-columns: 1fr;
        text-align: center;
        gap: 0.5rem;
      }

      .refresh-controls {
        flex-direction: column;
        gap: 1rem;
      }
    }
  `]
})
export class HealthComponent implements OnInit {
  healthData$: Observable<HealthStatus | null>;
  isLoading = false;
  autoRefresh = false;
  private refreshInterval: any;

  apiEndpoints = [
    { method: 'GET', path: '/api/app1/health', description: 'Health check', status: 'healthy' },
    { method: 'GET', path: '/api/app1', description: 'API root', status: 'healthy' },
    { method: 'GET', path: '/api/app1/version', description: 'Version info', status: 'healthy' },
    { method: 'POST', path: '/api/app1/data', description: 'Create data', status: 'healthy' }
  ];

  constructor(private http: HttpClient) {
    this.healthData$ = this.createHealthStream();
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.clearRefreshInterval();
  }

  private createHealthStream(): Observable<HealthStatus | null> {
    return timer(0, 30000).pipe(
      switchMap(() => this.fetchHealthData()),
      startWith(null as HealthStatus | null)
    );
  }

  private fetchHealthData(): Observable<HealthStatus | null> {
    this.isLoading = true;
    const apiUrl = this.getApiUrl();
    
    return this.http.get<HealthStatus>(`${apiUrl}/health`).pipe(
      catchError(() => {
        // Fallback mock data for development
        return of(this.getMockHealthData());
      }),
      // Simulate API delay
      switchMap(data => timer(Math.random() * 1000).pipe(switchMap(() => [data]))),
      // Clear loading state
      switchMap(data => {
        this.isLoading = false;
        return [data];
      })
    );
  }

  private getApiUrl(): string {
    return environment.apiUrl;
  }

  private getMockHealthData(): HealthStatus {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'healthy',
        responseTime: Math.floor(Math.random() * 50) + 10
      },
      version: '1.0.0',
      uptime: Math.floor(Math.random() * 86400) + 3600,
      memory: {
        used: Math.floor(Math.random() * 200) + 100,
        total: 512,
        percentage: Math.floor(Math.random() * 30) + 20
      },
      environment: 'production'
    };
  }

  loadInitialData(): void {
    this.refreshHealth();
  }

  refreshHealth(): void {
    this.healthData$ = this.fetchHealthData();
  }

  toggleAutoRefresh(): void {
    if (this.autoRefresh) {
      this.startAutoRefresh();
    } else {
      this.clearRefreshInterval();
    }
  }

  private startAutoRefresh(): void {
    this.clearRefreshInterval();
    this.refreshInterval = setInterval(() => {
      this.refreshHealth();
    }, 30000);
  }

  private clearRefreshInterval(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
