import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VendorListComponent } from './pages/list/vendors.component';

const routes: Routes = [
  { path: '', component: VendorListComponent },
  { path: '', pathMatch: 'full', redirectTo: 'vendors' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VendorsRoutingModule {}
