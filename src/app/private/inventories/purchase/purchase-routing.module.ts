import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'list',
  },
  {
    path: 'list',
    title: 'Listado de compras',
    data: { breadcrumb: 'Compras' },
    loadComponent: () =>
      import('./pages/purchase-list/purchase-list.component').then(
        m => m.PurchaseListComponent,
      ),
  },
  {
    path: 'register',
    title: 'Registro de compras',
    data: { breadcrumb: 'Nueva compra' },
    loadComponent: () =>
      import('./pages/purchase-register/purchase-register.component').then(
        c => c.PurchaseRegisterComponent,
      ),
  },
  {
    path: ':id',
    title: 'Detalle de compra',
    data: { breadcrumb: 'Detalle compra' },
    loadComponent: () =>
      import('./pages/purchase-detail/purchase-detail.component').then(
        m => m.PurchaseDetailComponent,
      ),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PurchaseRoutingModule {}
