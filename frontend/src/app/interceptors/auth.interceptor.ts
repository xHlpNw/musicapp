import { HttpInterceptorFn } from '@angular/common/http';

/** Не добавляем токен только для публичных эндпоинтов входа и регистрации */
function isPublicAuthRequest(url: string): boolean {
  return url.includes('/api/auth/login') || url.includes('/api/auth/register');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');

  if (token && !isPublicAuthRequest(req.url)) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned);
  }

  return next(req);
};
