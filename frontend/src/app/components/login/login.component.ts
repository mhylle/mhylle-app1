import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, LoginRequest } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-modal" [class.hidden]="!isVisible">
      <div class="login-form">
        <h2>🍭 Cosmic Candy Factory Login</h2>
        
        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div class="form-group">
            <label for="email">Email:</label>
            <input 
              type="email" 
              id="email" 
              name="email"
              [(ngModel)]="credentials.email" 
              required 
              #email="ngModel"
              placeholder="admin@mhylle.com">
            <div *ngIf="email.invalid && email.touched" class="error">
              Email is required
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password:</label>
            <input 
              type="password" 
              id="password" 
              name="password"
              [(ngModel)]="credentials.password" 
              required 
              #password="ngModel"
              placeholder="Admin123!">
            <div *ngIf="password.invalid && password.touched" class="error">
              Password is required
            </div>
          </div>

          <div *ngIf="errorMessage" class="error">
            {{ errorMessage }}
          </div>

          <div class="form-actions">
            <button 
              type="submit" 
              [disabled]="loginForm.invalid || isLoading">
              {{ isLoading ? 'Logging in...' : 'Login' }}
            </button>
          </div>
        </form>
        
        <div class="demo-credentials">
          <p><strong>Demo credentials:</strong></p>
          <p>Email: admin@mhylle.com</p>
          <p>Password: Admin123!</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    
    .login-modal.hidden {
      display: none;
    }
    
    .login-form {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      min-width: 350px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }
    
    h2 {
      margin-bottom: 1.5rem;
      text-align: center;
      color: #667eea;
    }
    
    .form-group {
      margin-bottom: 1rem;
    }
    
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: bold;
      color: #495057;
    }
    
    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      box-sizing: border-box;
    }
    
    input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
    }
    
    button {
      width: 100%;
      padding: 0.75rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: opacity 0.3s ease;
    }
    
    button:hover:not(:disabled) {
      opacity: 0.9;
    }
    
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    
    .error {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
    
    .demo-credentials {
      margin-top: 1.5rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 4px;
      font-size: 0.875rem;
      text-align: center;
    }
    
    .demo-credentials p {
      margin: 0.25rem 0;
    }
  `]
})
export class LoginComponent {
  @Output() loginSuccess = new EventEmitter<void>();
  
  isVisible = false;
  isLoading = false;
  errorMessage = '';
  
  credentials: LoginRequest = {
    email: 'admin@mhylle.com',
    password: 'Admin123!'
  };

  constructor(private authService: AuthService) {
    // Listen for login show events
    window.addEventListener('show-login', () => {
      this.show();
    });
  }

  show(): void {
    this.isVisible = true;
    this.errorMessage = '';
  }

  hide(): void {
    this.isVisible = false;
  }

  async onSubmit(): Promise<void> {
    if (this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.authService.login(this.credentials);
      this.hide();
      this.loginSuccess.emit();
    } catch (error: any) {
      this.errorMessage = error.message || 'Login failed';
    } finally {
      this.isLoading = false;
    }
  }
}