import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { User } from '../interfaces';
import { AuthService } from '../services/auth.service';

function isAuthenticatedUser(user: User | null): user is User {
  return !!user?.username?.trim();
}

function mustChangePassword(user: User): boolean {
  return user.mustChangePassword === true;
}

function isChangePasswordRoute(url: string): boolean {
  return url.includes('/change-password');
}

export const authGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService.ensureSessionLoaded().pipe(
    map(user => {
      if (!isAuthenticatedUser(user)) {
        authService.clearLocalSession();
        return router.createUrlTree(['auth', 'login']);
      }

      const onChangePasswordRoute = isChangePasswordRoute(state.url);

      if (mustChangePassword(user) && !onChangePasswordRoute) {
        return router.createUrlTree(['/change-password']);
      }

      if (!mustChangePassword(user) && onChangePasswordRoute) {
        return router.createUrlTree(['/']);
      }

      return true;
    }),
  );
};
