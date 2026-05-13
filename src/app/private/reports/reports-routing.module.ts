import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/reports/reports.component').then(c => c.ReportsComponent),
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./pages/products-report/products-report.component').then(
        c => c.ProductsReportComponent,
      ),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportsRoutingModule {}
