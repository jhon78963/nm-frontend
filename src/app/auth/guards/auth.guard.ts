import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { User } from '../interfaces';
import { AuthService } from '../services/auth.service';

function isAuthenticatedUser(user: User | null): user is User {
  return !!user?.username?.trim();
}

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService.ensureSessionLoaded().pipe(
    map(user => {
      if (isAuthenticatedUser(user)) {
        return true;
      }

      authService.clearLocalSession();
      return router.createUrlTree(['auth', 'login']);
    }),
  );
};
