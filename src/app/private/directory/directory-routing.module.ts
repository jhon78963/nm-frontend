import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'team',
    title: 'Equipo',
    data: { breadcrumb: 'Equipo' },
    loadChildren: () => import('./team/team.module').then(m => m.TeamModule),
  },
  {
    path: 'customers',
    title: 'Clientes',
    data: { breadcrumb: 'Clientes' },
    loadChildren: () =>
      import('./customers/customers.module').then(m => m.CustomersModule),
  },
  {
    path: 'vendors',
    title: 'Proveedores',
    data: { breadcrumb: 'Proveedores' },
    loadChildren: () =>
      import('./vendors/vendors.module').then(m => m.VendorsModule),
  },
  { path: '', pathMatch: 'full', redirectTo: 'team' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DirectoryRoutingModule {}
