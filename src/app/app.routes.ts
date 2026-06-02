import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/layout/app.layout.component';
import { authGuard } from './auth/guards/auth.guard';
import { permissionGuard } from './auth/guards/permission.guard';
import { ADMIN_ROUTE_ROLES, roleGuard } from './auth/guards/role.guard';

export const routes: Routes = [
  {
    path: 'change-password',
    title: 'Cambiar contraseña',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./auth/pages/change-password/change-password.component').then(
        m => m.ChangePasswordComponent,
      ),
  },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'administration',
        title: 'Administración',
        canActivate: [roleGuard, permissionGuard],
        data: {
          breadcrumb: 'Administración',
          roles: [...ADMIN_ROUTE_ROLES],
          permissions: [
            'role.getAll',
            'user.getAll',
            'tenant.getAll',
            'warehouse.getAll',
            'audit.getAll',
          ],
        },
        loadChildren: () =>
          import('./private/administration/administration.module').then(
            m => m.AdministrationModule,
          ),
      },
      {
        path: 'inventories',
        title: 'Inventario',
        canActivate: [permissionGuard],
        data: {
          breadcrumb: 'Inventario',
          permissions: [
            'product.getAll',
            'product.get',
            'purchase.getAll',
            'inventoryReconciliation.search',
            'size.getAll',
            'color.getAll',
          ],
        },
        loadChildren: () =>
          import('./private/inventories/inventories.module').then(
            m => m.InventoriesModule,
          ),
      },
      {
        path: 'reports',
        title: 'Reportes',
        canActivate: [permissionGuard],
        data: {
          breadcrumb: 'Reportes',
          permissions: ['report.index', 'report.products'],
        },
        loadChildren: () =>
          import('./private/reports/reports.module').then(m => m.ReportsModule),
      },
      {
        path: 'directory',
        title: 'Directorio',
        canActivate: [permissionGuard],
        data: {
          breadcrumb: 'Directorio',
          permissions: ['team.getAll', 'customer.getAll', 'vendor.getAll'],
        },
        loadChildren: () =>
          import('./private/directory/directory.module').then(
            m => m.DirectoryModule,
          ),
      },
      {
        path: 'sales/pos',
        title: 'POS',
        canActivate: [permissionGuard],
        data: { breadcrumb: 'POS', permission: 'pos.checkout' },
        loadChildren: () =>
          import('./private/finance/sales/pos/pos.module').then(
            m => m.PosModule,
          ),
      },
      {
        path: 'sales',
        title: 'Ventas',
        canActivate: [permissionGuard],
        data: {
          breadcrumb: 'Ventas',
          permissions: ['sale.getAll', 'sale.get'],
        },
        loadChildren: () =>
          import('./private/finance/sales/list/sales-list.module').then(
            m => m.SalesListModule,
          ),
      },
      {
        path: 'finance',
        title: 'Módulo Financiero',
        canActivate: [permissionGuard],
        data: {
          breadcrumb: 'Módulo Financiero',
          permissions: ['cashflow.getDaily', 'cashflow.getAdminMonthlyReport'],
        },
        loadChildren: () =>
          import('./private/finance/finance.module').then(m => m.FinanceModule),
      },
      {
        path: 'financial-summary',
        title: 'Resumen Financiero',
        canActivate: [permissionGuard],
        data: {
          breadcrumb: 'Resumen Financiero',
          permission: 'financialSummary.getSummary',
        },
        loadChildren: () =>
          import(
            './private/finance/financial-summary/financial-summary.module'
          ).then(m => m.FinancialSummaryModule),
      },
      {
        path: 'dashboard',
        redirectTo: '',
        pathMatch: 'full',
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
