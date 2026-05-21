import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { permissionGuard } from '../../auth/guards/permission.guard';

const routes: Routes = [
  {
    path: 'team',
    title: 'Equipo',
    canActivate: [permissionGuard],
    data: {
      breadcrumb: 'Equipo',
      permissions: ['team.getAll', 'team.get'],
    },
    loadChildren: () => import('./team/team.module').then(m => m.TeamModule),
  },
  {
    path: 'customers',
    title: 'Clientes',
    canActivate: [permissionGuard],
    data: {
      breadcrumb: 'Clientes',
      permissions: ['customer.getAll', 'customer.get'],
    },
    loadChildren: () =>
      import('./customers/customers.module').then(m => m.CustomersModule),
  },
  {
    path: 'vendors',
    title: 'Proveedores',
    canActivate: [permissionGuard],
    data: {
      breadcrumb: 'Proveedores',
      permissions: ['vendor.getAll', 'vendor.get'],
    },
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
