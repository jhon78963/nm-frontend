import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { permissionGuard } from '../../../auth/guards/permission.guard';
import { RoleSyncComponent } from './pages/form/role-sync.component';
import { RoleListComponent } from './pages/list/roles.component';

const routes: Routes = [
  {
    path: '',
    component: RoleListComponent,
    canActivate: [permissionGuard],
    data: { permission: 'role.getAll' },
  },
  {
    path: ':id/sync',
    component: RoleSyncComponent,
    title: 'Sincronizar permisos',
    canActivate: [permissionGuard],
    data: { breadcrumb: 'Permisos', permission: 'role.syncPermissions' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RolesRoutingModule {}
