import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="access-denied">
      <h1>🚫 Access Denied</h1>
      <p>You don't have permission to access the Cosmic Candy Factory.</p>
      <p *ngIf="userEmail">
        User: {{ userEmail }}
      </p>
      <p>Please contact an administrator if you believe this is an error.</p>
      <button (click)="logout()">Logout</button>
    </div>
  `,
  styles: [`
    .access-denied {
      text-align: center;
      padding: 2rem;
      max-width: 500px;
      margin: 2rem auto;
    }
    
    h1 {
      color: #dc3545;
      margin-bottom: 1rem;
    }
    
    p {
      margin-bottom: 1rem;
      line-height: 1.5;
      color: #495057;
    }
    
    button {
      padding: 0.75rem 1.5rem;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
    }
    
    button:hover {
      background: #0056b3;
    }
  `]
})
export class AccessDeniedComponent {
  userEmail: string | null = null;

  constructor(private authService: AuthService) {
    const user = this.authService.getCurrentUser();
    this.userEmail = user?.email || null;
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}