import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/** Roles con acceso a rutas administrativas (alineado con app.menu). */
export const ADMIN_ROUTE_ROLES = ['Admin', 'Super Admin'] as const;

type StoredUser = {
  role?: string;
  roles?: string[];
};

function userHasAllowedRole(
  user: StoredUser | undefined,
  allowedRoles: readonly string[],
): boolean {
  if (!user) {
    return false;
  }
  const { role, roles = [] } = user;
  if (role !== undefined && allowedRoles.includes(role)) {
    return true;
  }
  return roles.some(r => allowedRoles.includes(r));
}

function readStoredUser(): StoredUser | undefined {
  const raw = localStorage.getItem('user');
  if (!raw) {
    return undefined;
  }
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return undefined;
  }
}

export const roleGuard: CanActivateFn = route => {
  const router = inject(Router);
  const allowedRoles =
    (route.data['roles'] as string[] | undefined) ?? [...ADMIN_ROUTE_ROLES];

  if (allowedRoles.length === 0) {
    return router.createUrlTree(['/']);
  }

  const user = readStoredUser();
  if (userHasAllowedRole(user, allowedRoles)) {
    return true;
  }

  return router.createUrlTree(['/']);
};
