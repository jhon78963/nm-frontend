import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { map } from 'rxjs';
import { User } from '../interfaces';
import { AuthService } from '../services/auth.service';
import { showError } from '../../utils/notifications';

const SUPER_ADMIN_ROLE = 'Super Admin';

function isAuthenticatedUser(user: User | null): user is User {
  return !!user?.username?.trim();
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
 * en memoria (`AuthService.currentUser`), validados por el servidor vía auth/me.
 */
export const permissionGuard: CanActivateFn = route => {
  const router = inject(Router);
  const messageService = inject(MessageService);
  const authService = inject(AuthService);
  const required = resolveRequiredPermissions(route);

  if (required.length === 0) {
    return true;
  }

  return authService.ensureSessionLoaded().pipe(
    map(user => {
      if (!isAuthenticatedUser(user)) {
        authService.clearLocalSession();
        return router.createUrlTree(['auth', 'login']);
      }

      if (userHasAnyPermission(user, required)) {
        return true;
      }

      return denyAccess(router, messageService);
    }),
  );
};
