import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomerListComponent } from './pages/list/customers.component';

const routes: Routes = [
  { path: '', component: CustomerListComponent },
  { path: '', pathMatch: 'full', redirectTo: 'users' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CustomersRoutingModule {}
