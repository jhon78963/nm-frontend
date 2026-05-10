import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { PermissionsService } from '../services/permissions.service';

/**
 * Allows access only to client-tenant users (tenantId !== 1).
 * The SaaS provider's own admin account is redirected to /system-admin.
 *
 * Must be chained after authGuard so that PermissionsService is already
 * hydrated before this guard runs.
 */
export const tenantGuard: CanActivateFn = () => {
  const permissionsService = inject(PermissionsService);
  const router = inject(Router);

  if (!permissionsService.isSystemAdmin()) {
    return of(true);
  }

  return of(router.createUrlTree(['/system-admin']));
};
