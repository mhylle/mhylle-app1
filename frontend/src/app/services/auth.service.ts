import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  permissions: {
    apps: string[];
    roles: Record<string, string[]>;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserInfo | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Check for existing session on app startup
    this.validateSession();
  }

  async validateSession(): Promise<UserInfo | null> {
    try {
      const response = await fetch(`${environment.authUrl}/validate`, {
        credentials: 'include' // Include cookies
      });
      
      if (response.ok) {
        const result = await response.json();
        const user = result.user || result.data;
        
        // Store JWT token if provided
        if (result.access_token) {
          localStorage.setItem('auth_token', result.access_token);
        }
        
        this.currentUserSubject.next(user);
        return user;
      } else if (response.status === 401) {
        // 401 Unauthorized is expected when not logged in - don't log as error
        this.currentUserSubject.next(null);
        return null;
      }
    } catch (error) {
      // Only log actual network/unexpected errors, not authentication failures
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Session validation network error:', error);
      }
    }
    
    this.currentUserSubject.next(null);
    return null;
  }

  async register(credentials: RegisterRequest): Promise<UserInfo> {
    const response = await fetch(`${environment.authUrl}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // Include cookies
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }

    const result = await response.json();
    const user = result.data;
    
    // Don't automatically log in after registration
    // User needs to login separately for security
    return user;
  }

  async login(credentials: LoginRequest): Promise<UserInfo> {
    const response = await fetch(`${environment.authUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // Include cookies
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Login failed');
    }

    const result = await response.json();
    const user = result.user || result.data;
    
    // Store JWT token if provided
    if (result.access_token) {
      localStorage.setItem('auth_token', result.access_token);
    }
    
    this.currentUserSubject.next(user);
    return user;
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${environment.authUrl}/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear stored token
    localStorage.removeItem('auth_token');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): UserInfo | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  hasAppAccess(appId: string): boolean {
    const user = this.getCurrentUser();
    return user?.permissions.apps.includes(appId) || false;
  }

  hasRole(appId: string, role: string): boolean {
    const user = this.getCurrentUser();
    return user?.permissions.roles[appId]?.includes(role) || false;
  }
}