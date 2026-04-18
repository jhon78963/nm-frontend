import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    title: 'Registro de compras',
    data: { breadcrumb: 'Compras / abastecimiento' },
    loadComponent: () =>
      import('./pages/purchase-register/purchase-register.component').then(
        c => c.PurchaseRegisterComponent,
      ),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PurchaseRoutingModule {}
