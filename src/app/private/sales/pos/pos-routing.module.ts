import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PosComponent } from './pages/pos.component';

const routes: Routes = [
  { path: '', component: PosComponent },
  { path: '', pathMatch: 'full', redirectTo: 'sales/pos' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PosRoutingModule {}
