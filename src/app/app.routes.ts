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
        path: 'directory',
        title: 'Directorio',
        canActivate: [roleGuard],
        data: { breadcrumb: 'Directorio', roles: [...ADMIN_ROUTE_ROLES] },
        // TODO: permission guard por hijo (team.getAll, customer.getAll, vendor.getAll)
        loadChildren: () =>
          import('./private/directory/directory.module').then(
            m => m.DirectoryModule,
          ),
      },
      {
        path: 'sales/pos',
        title: 'POS',
        canActivate: [roleGuard],
        data: { breadcrumb: 'POS', roles: [...ADMIN_ROUTE_ROLES] },
        // TODO: permission:pos.searchProduct | pos.checkout
        loadChildren: () =>
          import('./private/finance/sales/pos/pos.module').then(m => m.PosModule),
      },
      {
        path: 'sales',
        title: 'Ventas',
        canActivate: [roleGuard],
        data: { breadcrumb: 'Ventas', roles: [...ADMIN_ROUTE_ROLES] },
        // TODO: permission:sale.getAll | sale.get | sale.update
        loadChildren: () =>
          import('./private/finance/sales/list/sales-list.module').then(
            m => m.SalesListModule,
          ),
      },
      {
        path: 'finance',
        title: 'Módulo Financiero',
        canActivate: [roleGuard],
        data: {
          breadcrumb: 'Módulo Financiero',
          roles: [...ADMIN_ROUTE_ROLES],
        },
        // TODO: permisos por hijo (cash-movement.*, expense.*, order.*)
        loadChildren: () =>
          import('./private/finance/finance.module').then(m => m.FinanceModule),
      },
      {
        path: 'financial-summary',
        title: 'Resumen Financiero',
        canActivate: [roleGuard],
        data: {
          breadcrumb: 'Resumen Financiero',
          roles: [...ADMIN_ROUTE_ROLES],
        },
        // TODO: permission granular de resumen financiero
        loadChildren: () =>
          import('./private/finance/financial-summary/financial-summary.module').then(
            m => m.FinancialSummaryModule,
          ),
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
