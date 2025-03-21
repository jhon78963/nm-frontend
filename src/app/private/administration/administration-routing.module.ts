import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'roles',
    title: 'Roles',
    data: { breadcrumb: 'Roles' },
    loadChildren: () => import('./roles/roles.module').then(m => m.RolesModule),
  },
  {
    path: 'users',
    title: 'Usuarios',
    data: { breadcrumb: 'Usuarios' },
    loadChildren: () => import('./users/users.module').then(m => m.UsersModule),
  },
  { path: '', pathMatch: 'full', redirectTo: 'roles' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdministrationRoutingModule {}
