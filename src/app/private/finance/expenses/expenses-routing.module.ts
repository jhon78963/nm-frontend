import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExpenseListComponent } from './pages/list/expenses.component';

const routes: Routes = [
  { path: '', component: ExpenseListComponent },
  { path: '', pathMatch: 'full', redirectTo: 'expenses' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ExpensesRoutingModule {}
