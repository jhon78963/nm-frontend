import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { PermissionsService } from '../services/permissions.service';

/**
 * Allows access only to the SaaS provider's own tenant (tenantId === 1).
 * Any authenticated client-tenant user is redirected to /pos.
 *
 * Must be chained after authGuard so that PermissionsService is already
 * hydrated before this guard runs.
 */
export const systemAdminGuard: CanActivateFn = () => {
  const permissionsService = inject(PermissionsService);
  const router = inject(Router);

  if (permissionsService.isSystemAdmin()) {
    return of(true);
  }

  return of(router.createUrlTree(['/pos']));
};
