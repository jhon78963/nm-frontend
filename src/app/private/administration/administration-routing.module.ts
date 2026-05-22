import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { permissionGuard } from '../../auth/guards/permission.guard';

const routes: Routes = [
  {
    path: 'roles',
    title: 'Roles y permisos',
    canActivate: [permissionGuard],
    data: { breadcrumb: 'Roles', permission: 'role.getAll' },
    loadChildren: () => import('./roles/roles.module').then(m => m.RolesModule),
  },
  {
    path: 'users',
    title: 'Usuarios',
    canActivate: [permissionGuard],
    data: { breadcrumb: 'Usuarios', permission: 'user.getAll' },
    loadChildren: () => import('./users/users.module').then(m => m.UsersModule),
  },
  {
    path: 'tenants',
    title: 'Clientes',
    canActivate: [permissionGuard],
    data: { breadcrumb: 'Clientes', permission: 'tenant.getAll' },
    loadChildren: () =>
      import('./tenants/tenants.module').then(m => m.TenantsModule),
  },
  {
    path: 'warehouses',
    title: 'Tiendas',
    canActivate: [permissionGuard],
    data: { breadcrumb: 'Tiendas', permission: 'warehouse.getAll' },
    loadChildren: () =>
      import('./warehouses/warehouses.module').then(m => m.WarehousesModule),
  },
  {
    path: 'action-logs',
    title: 'Historial de acciones',
    canActivate: [permissionGuard],
    data: { breadcrumb: 'Historial', permission: 'audit.getAll' },
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
