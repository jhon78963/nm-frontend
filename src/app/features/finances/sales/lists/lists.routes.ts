import { Routes } from '@angular/router';
import { permissionGuard } from '../../../../core/auth/permission.guard';

const routes: Routes = [
  {
    path: '',
    title: 'Ventas',
    data: {
      breadcrumb: 'Ventas',
      permissions: ['sale.getAll', 'sale.get'],
    },
    canActivate: [permissionGuard],
    loadComponent: () =>
      import('./components/sales-list/sales-list.component').then(
        (m) => m.SalesListComponent,
      ),
  },
  {
    path: 'new',
    redirectTo: '/finances/pos',
    pathMatch: 'full',
  },
  {
    path: ':id/exchange',
    title: 'Canje de venta',
    data: {
      breadcrumb: 'Canje',
      permissions: ['sale.exchange', 'sale.update'],
    },
    canActivate: [permissionGuard],
    loadComponent: () =>
      import('./components/sale-exchange-page/sale-exchange-page.component').then(
        (m) => m.SaleExchangePageComponent,
      ),
  },
  {
    path: ':id',
    title: 'Detalle de venta',
    data: {
      breadcrumb: 'Detalle de venta',
      permissions: ['sale.getAll', 'sale.get'],
    },
    canActivate: [permissionGuard],
    loadComponent: () =>
      import('./components/sale-detail-page/sale-detail-page.component').then(
        (m) => m.SaleDetailPageComponent,
      ),
  },
];

export default routes;
