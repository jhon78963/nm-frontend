import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AttendanceFormComponent } from './pages/attendance-form/attendance-form.component';
import { TeamListComponent } from './pages/list/team.component';

const routes: Routes = [
  { path: '', component: TeamListComponent, title: 'Equipo' },
  {
    path: 'asistencia/:teamId',
    component: AttendanceFormComponent,
    title: 'Asistencia',
    data: { breadcrumb: 'Asistencia' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TeamRoutingModule {}
