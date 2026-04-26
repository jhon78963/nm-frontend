import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AttendanceFormComponent } from './pages/attendance-form/attendance-form.component';
import { TeamListComponent } from './pages/list/team.component';
import { TeamPayrollComponent } from './pages/team-payroll/team-payroll.component';

const routes: Routes = [
  { path: '', component: TeamListComponent, title: 'Equipo' },
  {
    path: 'asistencia/:teamId',
    component: AttendanceFormComponent,
    title: 'Asistencia',
    data: { breadcrumb: 'Asistencia' },
  },
  {
    path: 'pagos/:teamId',
    component: TeamPayrollComponent,
    title: 'Pagos',
    data: { breadcrumb: 'Pagos' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TeamRoutingModule {}
