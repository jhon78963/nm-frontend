import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { User } from '../interfaces';
import { showError } from '../../utils/notifications';

const SUPER_ADMIN_ROLE = 'Super Admin';

function readUserFromStorage(): User | null {
  const raw = localStorage.getItem('user');
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as User;
    if (!parsed?.username?.trim()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function isSuperAdmin(user: User | null): boolean {
  if (!user) {
    return false;
  }

  if (user.role === SUPER_ADMIN_ROLE) {
    return true;
  }

  return (user.roles ?? []).includes(SUPER_ADMIN_ROLE);
}

function readUserPermissions(user: User | null): Set<string> {
  const names = user?.permissions ?? [];
  return new Set(
    names.filter(
      (permission): permission is string =>
        typeof permission === 'string' && permission.trim().length > 0,
    ),
  );
}

function resolveRequiredPermissions(route: ActivatedRouteSnapshot): string[] {
  const requiredPermission = route.data['permission'];
  if (typeof requiredPermission === 'string' && requiredPermission.trim()) {
    return [requiredPermission.trim()];
  }

  const requiredPermissions = route.data['permissions'];
  if (Array.isArray(requiredPermissions)) {
    return requiredPermissions.filter(
      (permission): permission is string =>
        typeof permission === 'string' && permission.trim().length > 0,
    );
  }

  return [];
}

/** Comprueba si el usuario tiene el permiso exacto (Spatie). */
export function userHasPermission(
  user: User | null,
  permission: string,
): boolean {
  if (isSuperAdmin(user)) {
    return true;
  }

  return readUserPermissions(user).has(permission);
}

/** Comprueba si el usuario tiene al menos uno de los permisos requeridos (OR). */
export function userHasAnyPermission(
  user: User | null,
  required: readonly string[],
): boolean {
  if (required.length === 0) {
    return true;
  }

  if (isSuperAdmin(user)) {
    return true;
  }

  const granted = readUserPermissions(user);
  return required.some(permission => granted.has(permission));
}

function denyAccess(router: Router, messageService: MessageService) {
  showError(messageService, 'Acceso Denegado');
  return router.createUrlTree(['/dashboard']);
}

/**
 * Guard funcional estricto de permisos granulares (Spatie).
 *
 * Configuración en la ruta:
 * - `data: { permission: 'pos.checkout' }` — permiso exacto obligatorio
 * - `data: { permissions: ['sale.getAll', 'sale.get'] }` — basta con tener uno (OR)
 *
 * Super Admin siempre pasa. Los demás se validan contra `user.permissions`
 * persistido en localStorage tras login / auth/me.
 */
export const permissionGuard: CanActivateFn = route => {
  const router = inject(Router);
  const messageService = inject(MessageService);
  const required = resolveRequiredPermissions(route);

  if (required.length === 0) {
    return true;
  }

  const user = readUserFromStorage();

  if (userHasAnyPermission(user, required)) {
    return true;
  }

  return denyAccess(router, messageService);
};
