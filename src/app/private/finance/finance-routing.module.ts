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
  {
    path: 'expenses',
    title: 'Gastos',
    data: { breadcrumb: 'Gastos' },
    loadChildren: () =>
      import('./expenses/expenses.module').then(m => m.ExpensesModule),
  },
  { path: '', pathMatch: 'full', redirectTo: 'cash-movements' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdministrationRoutingModule {}
