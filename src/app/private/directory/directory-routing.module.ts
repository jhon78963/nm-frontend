import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ADMIN_ROUTE_ROLES, roleGuard } from '../../auth/guards/role.guard';

const routes: Routes = [
  {
    path: 'team',
    title: 'Equipo',
    canActivate: [roleGuard],
    data: { breadcrumb: 'Equipo', roles: [...ADMIN_ROUTE_ROLES] },
    // TODO: permission:team.getAll | team.get
    loadChildren: () => import('./team/team.module').then(m => m.TeamModule),
  },
  {
    path: 'customers',
    title: 'Clientes',
    canActivate: [roleGuard],
    data: { breadcrumb: 'Clientes', roles: [...ADMIN_ROUTE_ROLES] },
    // TODO: permission:customer.getAll | customer.get
    loadChildren: () =>
      import('./customers/customers.module').then(m => m.CustomersModule),
  },
  {
    path: 'vendors',
    title: 'Proveedores',
    canActivate: [roleGuard],
    data: { breadcrumb: 'Proveedores', roles: [...ADMIN_ROUTE_ROLES] },
    // TODO: permission:vendor.getAll | vendor.get
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
