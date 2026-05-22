import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { User } from '../interfaces';
import { AuthService } from '../services/auth.service';

/** Roles con acceso a rutas administrativas (alineado con app.menu). */
export const ADMIN_ROUTE_ROLES = ['Admin', 'Super Admin'] as const;

function isAuthenticatedUser(user: User | null): user is User {
  return !!user?.username?.trim();
}

function userHasAllowedRole(
  user: User,
  allowedRoles: readonly string[],
): boolean {
  const { role, roles = [] } = user;
  if (role !== undefined && allowedRoles.includes(role)) {
    return true;
  }
  return roles.some(r => allowedRoles.includes(r));
}

export const roleGuard: CanActivateFn = route => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const allowedRoles = (route.data['roles'] as string[] | undefined) ?? [
    ...ADMIN_ROUTE_ROLES,
  ];

  if (allowedRoles.length === 0) {
    return router.createUrlTree(['/']);
  }

  return authService.ensureSessionLoaded().pipe(
    map(user => {
      if (!isAuthenticatedUser(user)) {
        authService.clearLocalSession();
        return router.createUrlTree(['auth', 'login']);
      }

      if (userHasAllowedRole(user, allowedRoles)) {
        return true;
      }

      return router.createUrlTree(['/']);
    }),
  );
};
