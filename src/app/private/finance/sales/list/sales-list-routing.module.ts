import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SaleListComponent } from './pages/list/list.component';

const routes: Routes = [
  { path: '', component: SaleListComponent },
  { path: '', pathMatch: 'full', redirectTo: 'sales' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SalesListRoutingModule {}
