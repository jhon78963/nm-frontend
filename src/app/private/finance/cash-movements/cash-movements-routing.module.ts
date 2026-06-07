import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { permissionGuard } from '../../../auth/guards/permission.guard';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/list/cash-movements.component').then(
        c => c.CashMovementsListComponent,
      ),
    canActivate: [permissionGuard],
    data: { permission: 'cashflow.getDaily' },
  },
  {
    path: 'admin-expenses',
    canActivate: [permissionGuard],
    data: { permission: 'cashflow.getAdminMonthlyReport' },
    loadComponent: () =>
      import('./pages/admin-expenses/admin-expenses.component').then(
        c => c.AdminExpensesComponent,
      ),
  },
  {
    path: 'accumulated-expenses',
    canActivate: [permissionGuard],
    data: { permission: 'cashflow.getAccumulatedExpensesReport' },
    loadComponent: () =>
      import(
        './pages/accumulated-expenses/accumulated-expenses.component'
      ).then(c => c.AccumulatedExpensesComponent),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CashMovementsRoutingModule {}
