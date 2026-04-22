import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'roles',
    title: 'Roles y permisos',
    data: { breadcrumb: 'Roles' },
    loadChildren: () => import('./roles/roles.module').then(m => m.RolesModule),
  },
  {
    path: 'users',
    title: 'Usuarios',
    data: { breadcrumb: 'Usuarios' },
    loadChildren: () => import('./users/users.module').then(m => m.UsersModule),
  },
  {
    path: 'tenants',
    title: 'Clientes',
    data: { breadcrumb: 'Clientes' },
    loadChildren: () =>
      import('./tenants/tenants.module').then(m => m.TenantsModule),
  },
  {
    path: 'warehouses',
    title: 'Tiendas',
    data: { breadcrumb: 'Tiendas' },
    loadChildren: () =>
      import('./warehouses/warehouses.module').then(m => m.WarehousesModule),
  },
  {
    path: 'action-logs',
    title: 'Historial de acciones',
    data: { breadcrumb: 'Historial' },
    loadChildren: () =>
      import('./action-logs/action-logs.module').then(m => m.ActionLogsModule),
  },
  { path: '', pathMatch: 'full', redirectTo: 'roles' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdministrationRoutingModule {}
