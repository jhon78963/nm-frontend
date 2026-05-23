import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { permissionGuard } from '../../../../auth/guards/permission.guard';
import { SaleListComponent } from './pages/list/list.component';

const routes: Routes = [
  {
    path: '',
    component: SaleListComponent,
    canActivate: [permissionGuard],
    data: {
      permissions: ['sale.getAll', 'sale.get'],
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SalesListRoutingModule {}
