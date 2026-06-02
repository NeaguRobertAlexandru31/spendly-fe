import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from '@core/services/auth/auth';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.user()) return true;

  return auth.fetchMe().pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/auth/login']))),
  );
};
