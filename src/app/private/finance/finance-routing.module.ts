import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { permissionGuard } from '../../auth/guards/permission.guard';

const routes: Routes = [
  {
    path: 'cash-movements',
    title: 'Movimientos de Caja',
    canActivate: [permissionGuard],
    data: {
      breadcrumb: 'Movimientos de Caja',
      permission: 'cashflow.getDaily',
    },
    loadChildren: () =>
      import('./cash-movements/cash-movements.module').then(
        m => m.CashMovementsModule,
      ),
  },
  {
    path: 'expenses',
    title: 'Gastos',
    canActivate: [permissionGuard],
    data: { breadcrumb: 'Gastos', permission: 'expense.getAll' },
    loadChildren: () =>
      import('./expenses/expenses.module').then(m => m.ExpensesModule),
  },
  {
    path: 'orders',
    title: 'Ordenes',
    canActivate: [permissionGuard],
    data: { breadcrumb: 'Ordenes', permission: 'order.getAll' },
    loadChildren: () =>
      import('./orders/orders.module').then(m => m.OrdersModule),
  },
  { path: '', pathMatch: 'full', redirectTo: 'cash-movements' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdministrationRoutingModule {}
