import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="home-container">
      
      <section class="hero">
        <h1>Welcome to App1</h1>
        <p class="hero-subtitle">A demonstration application for the mhylle.com infrastructure</p>
        <div class="hero-actions">
          <a routerLink="/features" class="btn btn-primary">Explore Features</a>
          <a routerLink="/about" class="btn btn-secondary">Learn More</a>
        </div>
      </section>

      <section class="features-preview">
        <h2>Key Features</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🏗️</div>
            <h3>Microservice Architecture</h3>
            <p>Independent deployment with shared infrastructure</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔄</div>
            <h3>CI/CD Pipeline</h3>
            <p>Automated deployment via GitHub Actions</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🐳</div>
            <h3>Docker Containerization</h3>
            <p>Consistent environments from dev to production</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔒</div>
            <h3>SSL & Security</h3>
            <p>Let's Encrypt certificates with security headers</p>
          </div>
        </div>
      </section>

      <section class="stats">
        <h2>Infrastructure Stats</h2>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-number">{{ stats.uptime }}</span>
            <span class="stat-label">Uptime</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ stats.deployments }}</span>
            <span class="stat-label">Deployments</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ stats.responseTime }}</span>
            <span class="stat-label">Avg Response</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ stats.requests }}</span>
            <span class="stat-label">Daily Requests</span>
          </div>
        </div>
      </section>

      <section class="getting-started">
        <h2>Getting Started</h2>
        <div class="steps">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h3>Check the Health Status</h3>
              <p>Visit the <a routerLink="/health">health check page</a> to see system status</p>
            </div>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h3>Explore the API</h3>
              <p>The backend API is available at <code>/api/app1</code></p>
            </div>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h3>View the Source</h3>
              <p>Check out the code on <a href="https://github.com/mhylle" target="_blank">GitHub</a></p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .home-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .hero {
      text-align: center;
      padding: 4rem 0;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      border-radius: 1rem;
      margin-bottom: 3rem;
    }

    .hero h1 {
      font-size: 3rem;
      font-weight: 300;
      margin-bottom: 1rem;
      color: #333;
    }

    .hero-subtitle {
      font-size: 1.25rem;
      color: #666;
      margin-bottom: 2rem;
    }

    .hero-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.75rem 2rem;
      border: none;
      border-radius: 0.5rem;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background: #5a6fd8;
      transform: translateY(-2px);
    }

    .btn-secondary {
      background: #f8f9fa;
      color: #495057;
      border: 1px solid #dee2e6;
    }

    .btn-secondary:hover {
      background: #e9ecef;
      transform: translateY(-2px);
    }

    .features-preview {
      margin-bottom: 3rem;
    }

    .features-preview h2 {
      text-align: center;
      margin-bottom: 2rem;
      color: #333;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
    }

    .feature-card {
      background: white;
      padding: 2rem;
      border-radius: 1rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      text-align: center;
      transition: transform 0.3s ease;
    }

    .feature-card:hover {
      transform: translateY(-4px);
    }

    .feature-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .feature-card h3 {
      margin-bottom: 1rem;
      color: #333;
    }

    .feature-card p {
      color: #666;
      line-height: 1.6;
    }

    .stats {
      background: #343a40;
      color: white;
      padding: 3rem;
      border-radius: 1rem;
      margin-bottom: 3rem;
    }

    .stats h2 {
      text-align: center;
      margin-bottom: 2rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
    }

    .stat-item {
      text-align: center;
    }

    .stat-number {
      display: block;
      font-size: 2.5rem;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 0.5rem;
    }

    .stat-label {
      color: #adb5bd;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .getting-started {
      margin-bottom: 3rem;
    }

    .getting-started h2 {
      text-align: center;
      margin-bottom: 2rem;
      color: #333;
    }

    .steps {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .step {
      display: flex;
      gap: 1.5rem;
      align-items: flex-start;
    }

    .step-number {
      background: #667eea;
      color: white;
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      flex-shrink: 0;
    }

    .step-content h3 {
      margin-bottom: 0.5rem;
      color: #333;
    }

    .step-content p {
      color: #666;
      line-height: 1.6;
    }

    .step-content a {
      color: #667eea;
      text-decoration: none;
    }

    .step-content a:hover {
      text-decoration: underline;
    }

    .step-content code {
      background: #f8f9fa;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-family: 'Courier New', monospace;
      color: #e83e8c;
    }

    @media (max-width: 768px) {
      .hero h1 {
        font-size: 2rem;
      }

      .hero-actions {
        flex-direction: column;
        align-items: center;
      }

      .step {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class HomeComponent {
  stats = {
    uptime: '99.9%',
    deployments: '42',
    responseTime: '<100ms',
    requests: '1.2K'
  };
}
