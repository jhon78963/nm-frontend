import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ADMIN_ROUTE_ROLES, roleGuard } from '../../auth/guards/role.guard';

const routes: Routes = [
  {
    path: 'cash-movements',
    title: 'Movimientos de Caja',
    canActivate: [roleGuard],
    data: {
      breadcrumb: 'Movimientos de Caja',
      roles: [...ADMIN_ROUTE_ROLES],
    },
    // TODO: permission granular de caja
    loadChildren: () =>
      import('./cash-movements/cash-movements.module').then(
        m => m.CashMovementsModule,
      ),
  },
  {
    path: 'expenses',
    title: 'Gastos',
    canActivate: [roleGuard],
    data: { breadcrumb: 'Gastos', roles: [...ADMIN_ROUTE_ROLES] },
    // TODO: permission:expense.*
    loadChildren: () =>
      import('./expenses/expenses.module').then(m => m.ExpensesModule),
  },
  {
    path: 'orders',
    title: 'Ordenes',
    canActivate: [roleGuard],
    data: { breadcrumb: 'Ordenes', roles: [...ADMIN_ROUTE_ROLES] },
    // TODO: permission:order.*
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
