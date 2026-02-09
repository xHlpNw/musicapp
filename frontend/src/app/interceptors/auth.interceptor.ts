import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Не добавляем токен только для публичных эндпоинтов входа и регистрации */
function isPublicAuthRequest(url: string): boolean {
  return url.includes('/api/auth/login') || url.includes('/api/auth/register');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();

  const request = token && !isPublicAuthRequest(req.url)
    ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
    : req;

  return next(request).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && req.url.includes('/api/') && !isPublicAuthRequest(req.url)) {
        setTimeout(() => {
          auth.logout();
          router.navigate(['/login']);
        }, 0);
      }
      return throwError(() => err);
    })
  );
};
