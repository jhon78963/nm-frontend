import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { permissionGuard } from '../../../auth/guards/permission.guard';
import { VendorListComponent } from './pages/list/vendors.component';

const routes: Routes = [
  {
    path: '',
    component: VendorListComponent,
    canActivate: [permissionGuard],
    data: {
      permissions: ['vendor.getAll', 'vendor.get'],
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VendorsRoutingModule {}
