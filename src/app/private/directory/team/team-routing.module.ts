import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TeamListComponent } from './pages/list/team.component';

const routes: Routes = [
  { path: '', component: TeamListComponent },
  { path: '', pathMatch: 'full', redirectTo: 'roles' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TeamRoutingModule {}
