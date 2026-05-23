import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { permissionGuard } from '../../../auth/guards/permission.guard';
import { CustomerListComponent } from './pages/list/customers.component';

const routes: Routes = [
  {
    path: '',
    component: CustomerListComponent,
    canActivate: [permissionGuard],
    data: {
      permissions: ['customer.getAll', 'customer.get'],
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CustomersRoutingModule {}
