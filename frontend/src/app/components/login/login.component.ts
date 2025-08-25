import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, LoginRequest, RegisterRequest } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-modal" [class.hidden]="!isVisible">
      <div class="login-form">
        <div class="mode-toggle">
          <button 
            type="button" 
            [class.active]="!isRegisterMode" 
            (click)="switchMode(false)"
            class="toggle-btn">
            Login
          </button>
          <button 
            type="button" 
            [class.active]="isRegisterMode" 
            (click)="switchMode(true)"
            class="toggle-btn">
            Register
          </button>
        </div>

        <h2>🍭 Cosmic Candy Factory {{ isRegisterMode ? 'Registration' : 'Login' }}</h2>
        
        <!-- Login Form -->
        <form *ngIf="!isRegisterMode" (ngSubmit)="onLogin()" #loginForm="ngForm">
          <div class="form-group">
            <label for="email">Email:</label>
            <input 
              type="email" 
              id="email" 
              name="email"
              [(ngModel)]="loginCredentials.email" 
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
              [(ngModel)]="loginCredentials.password" 
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

        <!-- Registration Form -->
        <form *ngIf="isRegisterMode" (ngSubmit)="onRegister()" #registerForm="ngForm">
          <div class="form-group">
            <label for="regFirstName">First Name:</label>
            <input 
              type="text" 
              id="regFirstName" 
              name="regFirstName"
              [(ngModel)]="registerCredentials.firstName" 
              required 
              minlength="2"
              #regFirstName="ngModel"
              placeholder="John">
            <div *ngIf="regFirstName.invalid && regFirstName.touched" class="error">
              <span *ngIf="regFirstName.errors?.['required']">First name is required</span>
              <span *ngIf="regFirstName.errors?.['minlength']">First name must be at least 2 characters</span>
            </div>
          </div>

          <div class="form-group">
            <label for="regLastName">Last Name:</label>
            <input 
              type="text" 
              id="regLastName" 
              name="regLastName"
              [(ngModel)]="registerCredentials.lastName" 
              required 
              minlength="2"
              #regLastName="ngModel"
              placeholder="Doe">
            <div *ngIf="regLastName.invalid && regLastName.touched" class="error">
              <span *ngIf="regLastName.errors?.['required']">Last name is required</span>
              <span *ngIf="regLastName.errors?.['minlength']">Last name must be at least 2 characters</span>
            </div>
          </div>

          <div class="form-group">
            <label for="regEmail">Email:</label>
            <input 
              type="email" 
              id="regEmail" 
              name="regEmail"
              [(ngModel)]="registerCredentials.email" 
              required 
              #regEmail="ngModel"
              placeholder="your.email@example.com">
            <div *ngIf="regEmail.invalid && regEmail.touched" class="error">
              Valid email is required
            </div>
          </div>

          <div class="form-group">
            <label for="regPassword">Password:</label>
            <input 
              type="password" 
              id="regPassword" 
              name="regPassword"
              [(ngModel)]="registerCredentials.password" 
              required 
              minlength="6"
              pattern="^(?=.*\d)[a-zA-Z\d]+$"
              #regPassword="ngModel"
              placeholder="password123">
            <div *ngIf="regPassword.invalid && regPassword.touched" class="error">
              <span *ngIf="regPassword.errors?.['required']">Password is required</span>
              <span *ngIf="regPassword.errors?.['minlength']">Password must be at least 6 characters</span>
              <span *ngIf="regPassword.errors?.['pattern']">Password must contain at least one number and only letters/numbers</span>
            </div>
          </div>

          <div class="form-group">
            <label for="regConfirmPassword">Confirm Password:</label>
            <input 
              type="password" 
              id="regConfirmPassword" 
              name="regConfirmPassword"
              [(ngModel)]="registerCredentials.confirmPassword" 
              required 
              #regConfirmPassword="ngModel"
              placeholder="password123">
            <div *ngIf="regConfirmPassword.invalid && regConfirmPassword.touched" class="error">
              Confirm password is required
            </div>
            <div *ngIf="regConfirmPassword.valid && registerCredentials.password !== registerCredentials.confirmPassword" class="error">
              Passwords do not match
            </div>
          </div>

          <div *ngIf="errorMessage" class="error">
            {{ errorMessage }}
          </div>

          <div *ngIf="successMessage" class="success">
            {{ successMessage }}
          </div>

          <div class="form-actions">
            <button 
              type="submit" 
              [disabled]="registerForm.invalid || isLoading || registerCredentials.password !== registerCredentials.confirmPassword">
              {{ isLoading ? 'Registering...' : 'Register' }}
            </button>
          </div>
        </form>
        
        <div *ngIf="!isRegisterMode" class="demo-credentials">
          <p><strong>Demo credentials:</strong></p>
          <p>Email: admin@mhylle.com</p>
          <p>Password: Admin123!</p>
        </div>

        <button type="button" class="close-btn" (click)="hide()">×</button>
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
      min-width: 400px;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      position: relative;
    }
    
    .close-btn {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #666;
      width: auto;
      padding: 0;
      line-height: 1;
    }
    
    .close-btn:hover {
      color: #000;
    }
    
    .mode-toggle {
      display: flex;
      margin-bottom: 1.5rem;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #ddd;
    }
    
    .toggle-btn {
      flex: 1;
      padding: 0.75rem;
      background: #f8f9fa;
      color: #495057;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 0.9rem;
    }
    
    .toggle-btn.active {
      background: #667eea;
      color: white;
    }
    
    .toggle-btn:hover:not(.active) {
      background: #e9ecef;
    }
    
    h2 {
      margin-bottom: 1.5rem;
      text-align: center;
      color: #667eea;
      font-size: 1.3rem;
    }
    
    .form-group {
      margin-bottom: 1rem;
    }
    
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: bold;
      color: #495057;
      font-size: 0.9rem;
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
    
    .form-actions button {
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
    
    .form-actions button:hover:not(:disabled) {
      opacity: 0.9;
    }
    
    .form-actions button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    
    .error {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
    
    .success {
      color: #28a745;
      font-size: 0.875rem;
      margin-top: 0.25rem;
      padding: 0.75rem;
      background: #d4edda;
      border: 1px solid #c3e6cb;
      border-radius: 4px;
      text-align: center;
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
  @Output() registrationSuccess = new EventEmitter<void>();
  
  isVisible = false;
  isLoading = false;
  isRegisterMode = false;
  errorMessage = '';
  successMessage = '';
  
  loginCredentials: LoginRequest = {
    email: 'admin@mhylle.com',
    password: 'Admin123!'
  };

  registerCredentials: RegisterRequest = {
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  };

  constructor(private authService: AuthService) {
    // Listen for login show events
    window.addEventListener('show-login', () => {
      this.show();
      this.isRegisterMode = false;
    });
    
    // Listen for register show events
    window.addEventListener('show-register', () => {
      this.show();
      this.isRegisterMode = true;
    });
  }

  show(): void {
    this.isVisible = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  hide(): void {
    this.isVisible = false;
    this.isRegisterMode = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  switchMode(isRegister: boolean): void {
    this.isRegisterMode = isRegister;
    this.errorMessage = '';
    this.successMessage = '';
  }

  async onLogin(): Promise<void> {
    if (this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.authService.login(this.loginCredentials);
      console.log('Login successful for Cosmic Candy Factory!');
      this.hide();
      this.loginSuccess.emit();
    } catch (error: any) {
      this.errorMessage = error.message || 'Login failed';
    } finally {
      this.isLoading = false;
    }
  }

  async onRegister(): Promise<void> {
    if (this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      await this.authService.register(this.registerCredentials);
      this.successMessage = 'Registration successful! You can now login with your new account.';
      
      // Clear the form
      this.registerCredentials = {
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        confirmPassword: ''
      };
      
      // Switch back to login mode after successful registration
      setTimeout(() => {
        this.switchMode(false);
        this.successMessage = '';
      }, 3000);
      
      this.registrationSuccess.emit();
    } catch (error: any) {
      this.errorMessage = error.message || 'Registration failed';
    } finally {
      this.isLoading = false;
    }
  }
}