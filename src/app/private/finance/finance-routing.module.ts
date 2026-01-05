import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'cash-movements',
    title: 'Movimientos de Caja',
    data: { breadcrumb: 'Movimientos de Caja' },
    loadChildren: () =>
      import('./cash-movements/cash-movements.module').then(
        m => m.CashMovementsModule,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'roles' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdministrationRoutingModule {}
