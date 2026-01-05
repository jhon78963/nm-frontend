import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FinancialSummaryListComponent } from './pages/list/financial-summary.component';

const routes: Routes = [
  { path: '', component: FinancialSummaryListComponent },
  { path: '', pathMatch: 'full', redirectTo: 'financial-summary' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FinancialSummaryRoutingModule {}
