import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, tap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { PermissionsService } from '../services/permissions.service';

/**
 * Verifies that a valid token exists AND that the user profile
 * is hydrated in PermissionsService.
 *
 * On the first navigation after a page refresh the profile is
 * fetched from /auth/me so downstream guards can inspect
 * tenantId, permissions and features without extra API calls.
 */
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const permissionsService = inject(PermissionsService);
  const authService = inject(AuthService);

  let parsedToken: { token?: string } | null = null;
  try {
    const raw = localStorage.getItem('tokenData');
    parsedToken = raw ? JSON.parse(raw) : null;
  } catch {
    return router.navigate(['auth/login']);
  }

  if (!parsedToken?.token) {
    return router.navigate(['auth/login']);
  }

  // User already loaded → skip network round-trip
  if (permissionsService.getUser()) {
    return of(true);
  }

  // Page refresh: reload profile and hydrate permission state
  return authService.me().pipe(
    tap(user => permissionsService.setUser(user)),
    map(() => true),
    catchError(() => {
      localStorage.removeItem('tokenData');
      return of(router.createUrlTree(['auth/login']));
    }),
  );
};

