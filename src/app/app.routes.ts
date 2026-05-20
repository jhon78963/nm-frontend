import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/layout/app.layout.component';
import { authGuard } from './auth/guards/auth.guard';
import { ADMIN_ROUTE_ROLES, roleGuard } from './auth/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'administration',
        title: 'Administración',
        canActivate: [roleGuard],
        data: { breadcrumb: 'Administración', roles: [...ADMIN_ROUTE_ROLES] },
        loadChildren: () =>
          import('./private/administration/administration.module').then(
            m => m.AdministrationModule,
          ),
      },
      {
        path: 'inventories',
        title: 'Inventario',
        canActivate: [roleGuard],
        data: { breadcrumb: 'Inventario', roles: [...ADMIN_ROUTE_ROLES] },
        loadChildren: () =>
          import('./private/inventories/inventories.module').then(
            m => m.InventoriesModule,
          ),
      },
      {
        path: 'reports',
        title: 'Reportes',
        canActivate: [roleGuard],
        data: { breadcrumb: 'Reportes', roles: [...ADMIN_ROUTE_ROLES] },
        loadChildren: () =>
          import('./private/reports/reports.module').then(m => m.ReportsModule),
      },
      {
        path: '',
        loadChildren: () =>
          import('./private/private.module').then(m => m.PrivateModule),
      },
    ],
  },
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
  { path: '', pathMatch: 'full', redirectTo: '' },
  { path: '**', redirectTo: '/notfound' },
];
