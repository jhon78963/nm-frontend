import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/list/cash-movements.component').then(
        c => c.CashMovementsListComponent,
      ),
  },
  {
    path: 'admin-expenses',
    loadComponent: () =>
      import('./pages/admin-expenses/admin-expenses.component').then(
        c => c.AdminExpensesComponent,
      ),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CashMovementsRoutingModule {}
