import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '@core/services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const apiReq = req.url.startsWith('/api')
    ? req.clone({ withCredentials: true })
    : req;

  return next(apiReq).pipe(
    catchError(err => {
      const isAuthEndpoint = req.url.startsWith('/api/auth/');
      if (err.status === 401 && !isAuthEndpoint) {
        auth.user.set(null);
        router.navigate(['/auth/login']);
      }
      return throwError(() => err);
    }),
  );
};
