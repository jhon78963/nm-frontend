import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { permissionGuard } from '../../../../auth/guards/permission.guard';
import { AttendanceFormComponent } from './pages/attendance-form/attendance-form.component';
import { TeamListComponent } from './pages/list/team.component';
import { TeamPayrollComponent } from './pages/team-payroll/team-payroll.component';

const routes: Routes = [
  { path: '', component: TeamListComponent, title: 'Equipo' },
  {
    path: 'asistencia/:teamId',
    component: AttendanceFormComponent,
    title: 'Asistencia',
    canActivate: [permissionGuard],
    data: {
      breadcrumb: 'Asistencia',
      permissions: ['team.getAttendanceByMonth', 'team.storeAttendance'],
    },
  },
  {
    path: 'pagos/:teamId',
    component: TeamPayrollComponent,
    title: 'Pagos',
    canActivate: [permissionGuard],
    data: {
      breadcrumb: 'Pagos',
      permission: 'team.getPaymentByMonth',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TeamRoutingModule {}
