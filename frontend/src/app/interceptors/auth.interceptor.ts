import { HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);
  
  // Get JWT token from localStorage
  const token = localStorage.getItem('auth_token');
  
  // Clone request and add headers
  let authReq = req.clone({
    setHeaders: {
      'Content-Type': 'application/json'
    },
    withCredentials: true // Include cookies for session-based auth
  });

  // Add JWT Authorization header if token exists
  if (token) {
    authReq = authReq.clone({
      setHeaders: {
        ...authReq.headers,
        'Authorization': `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Unauthorized - clear user and show login
        authService.logout();
        const event = new CustomEvent('show-login');
        window.dispatchEvent(event);
      }
      return throwError(() => error);
    })
  );
}