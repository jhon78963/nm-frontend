import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { permissionGuard } from '../../../../auth/guards/permission.guard';
import { PosComponent } from './pages/pos.component';

const routes: Routes = [
  {
    path: '',
    component: PosComponent,
    canActivate: [permissionGuard],
    data: { permission: 'pos.checkout' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PosRoutingModule {}
