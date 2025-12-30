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
  // {
  //   path: 'users',
  //   title: 'Usuarios',
  //   data: { breadcrumb: 'Usuarios' },
  //   loadChildren: () => import('./users/users.module').then(m => m.UsersModule),
  // },
  { path: '', pathMatch: 'full', redirectTo: 'roles' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdministrationRoutingModule {}
