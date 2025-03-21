import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserListComponent } from './pages/list/users.component';

const routes: Routes = [
  { path: '', component: UserListComponent },
  { path: '', pathMatch: 'full', redirectTo: 'users' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UsersRoutingModule {}
