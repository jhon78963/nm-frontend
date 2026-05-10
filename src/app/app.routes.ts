import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/layout/app.layout.component';
import { authGuard } from './auth/guards/auth.guard';
import { systemAdminGuard } from './auth/guards/system-admin.guard';
import { tenantGuard } from './auth/guards/tenant.guard';

/**
 * Root route table.
 *
 * Two protected areas:
 *  · /system-admin  → SaaS provider panel (tenantId === 1 only)
 *  · /pos           → Client-tenant POS panel (any tenant except 1)
 *
 * authGuard always runs first; it hydrates PermissionsService so
 * the downstream guards can check tenantId without extra API calls.
 */
export const routes: Routes = [
  // Default redirect — guards will bounce the user to the right panel
  { path: '', redirectTo: 'pos', pathMatch: 'full' },

  // ── SaaS provider panel ──────────────────────────────────────────────────
  {
    path: 'system-admin',
    canActivate: [authGuard, systemAdminGuard],
    loadChildren: () =>
      import('./system-admin/system-admin.routes').then(
        m => m.SYSTEM_ADMIN_ROUTES,
      ),
  },

  // ── Client-tenant POS panel ──────────────────────────────────────────────
  {
    path: 'pos',
    component: AppLayoutComponent,
    canActivate: [authGuard, tenantGuard],
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./private/private.module').then(m => m.PrivateModule),
      },
    ],
  },

  // ── Public routes ────────────────────────────────────────────────────────
  {
    path: 'auth',
    data: { breadcrumb: 'Auth' },
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule),
  },
  {
    path: 'notfound',
    loadChildren: () =>
      import('./notfound/notfound.module').then(m => m.NotfoundModule),
  },
  { path: '**', redirectTo: '/notfound' },
];
