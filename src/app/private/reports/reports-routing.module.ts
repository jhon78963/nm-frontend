import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { permissionGuard } from '../../auth/guards/permission.guard';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/reports/reports.component').then(c => c.ReportsComponent),
    canActivate: [permissionGuard],
    data: { permission: 'report.index' },
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./pages/products-report/products-report.component').then(
        c => c.ProductsReportComponent,
      ),
    canActivate: [permissionGuard],
    data: { permission: 'report.products' },
  },
  {
    path: 'sales',
    loadComponent: () =>
      import('./pages/sales-report/sales-report.component').then(
        c => c.SalesReportComponent,
      ),
    canActivate: [permissionGuard],
    data: { permission: 'report.sales' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportsRoutingModule {}
