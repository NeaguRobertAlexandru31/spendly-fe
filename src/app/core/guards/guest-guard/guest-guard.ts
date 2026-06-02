import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from '@core/services/auth/auth';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.user()) return router.createUrlTree(['/dashboard']);

  return auth.fetchMe().pipe(
    map(() => router.createUrlTree(['/dashboard'])),
    catchError(() => of(true)),
  );
};
