import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoleSyncComponent } from './pages/form/role-sync.component';
import { RoleListComponent } from './pages/list/roles.component';

const routes: Routes = [
  { path: '', component: RoleListComponent },
  {
    path: ':id/sync',
    component: RoleSyncComponent,
    title: 'Sincronizar permisos',
    data: { breadcrumb: 'Permisos' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RolesRoutingModule {}
