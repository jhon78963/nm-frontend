import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { showError } from '../../utils/notifications';
import { ADMIN_ROUTE_ROLES } from './role.guard';

type StoredUser = {
  role?: string;
  roles?: string[];
  permissions?: string[];
};

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

function isAdminUser(user: StoredUser | undefined): boolean {
  if (!user) {
    return false;
  }
  const { role, roles = [] } = user;
  if (role !== undefined && (ADMIN_ROUTE_ROLES as readonly string[]).includes(role)) {
    return true;
  }
  return roles.some(r => (ADMIN_ROUTE_ROLES as readonly string[]).includes(r));
}

function readUserPermissions(user: StoredUser | undefined): Set<string> {
  const names = user?.permissions ?? [];
  return new Set(names.filter(p => typeof p === 'string' && p.trim().length > 0));
}

function resolveRequiredPermissions(route: {
  data: Record<string, unknown>;
}): string[] {
  const single = route.data['permission'];
  if (typeof single === 'string' && single.trim()) {
    return [single.trim()];
  }

  const many = route.data['permissions'];
  if (Array.isArray(many)) {
    return many.filter(
      (p): p is string => typeof p === 'string' && p.trim().length > 0,
    );
  }

  return [];
}

/** Usuario tiene al menos uno de los permisos requeridos (OR). */
export function userHasAnyPermission(
  user: StoredUser | undefined,
  required: readonly string[],
): boolean {
  if (required.length === 0) {
    return true;
  }

  if (isAdminUser(user)) {
    return true;
  }

  const granted = readUserPermissions(user);
  return required.some(name => granted.has(name));
}

function denyAccess(router: Router, messageService: MessageService) {
  showError(messageService, 'No tienes permiso para acceder a esta sección.');
  return router.createUrlTree(['/']);
}

/**
 * Guard funcional de permisos granulares (Spatie).
 *
 * Configuración en la ruta:
 * - `data: { permission: 'pos.checkout' }` — un permiso obligatorio
 * - `data: { permissions: ['sale.getAll', 'sale.get'] }` — basta con tener uno (OR)
 *
 * Admin / Super Admin siempre pasan. Los demás se validan contra `user.permissions`
 * persistido en localStorage tras `auth/me`.
 */
export const permissionGuard: CanActivateFn = route => {
  const router = inject(Router);
  const messageService = inject(MessageService);
  const required = resolveRequiredPermissions(route);

  if (required.length === 0) {
    return true;
  }

  const user = readStoredUser();
  if (userHasAnyPermission(user, required)) {
    return true;
  }

  return denyAccess(router, messageService);
};
