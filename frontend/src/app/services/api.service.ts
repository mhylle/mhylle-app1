import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor() {}

  private async getAuthToken(): Promise<string | null> {
    // First, try to get token from localStorage (if stored there)
    const token = localStorage.getItem('auth_token');
    if (token) {
      return token;
    }

    // If no token in localStorage, try to validate current session with auth service
    try {
      const response = await fetch(`${environment.authUrl}/validate`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        // The auth service might return a token we can use
        if (result.access_token) {
          localStorage.setItem('auth_token', result.access_token);
          return result.access_token;
        }
      }
    } catch (error) {
      console.error('Failed to get auth token:', error);
    }

    return null;
  }

  private async makeAuthenticatedRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = await this.getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeAuthenticatedRequest(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeAuthenticatedRequest(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.makeAuthenticatedRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeAuthenticatedRequest(endpoint, { method: 'DELETE' });
  }
}