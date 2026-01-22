import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ExpensesRoutingModule } from './expenses-routing.module';
import { SharedModule } from '../../../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogService } from 'primeng/dynamicdialog';
import { ExpenseListComponent } from './pages/list/expenses.component';
import { ExpenseFormComponent } from './pages/form/expenses-form.component';

@NgModule({
  declarations: [ExpenseListComponent, ExpenseFormComponent],
  imports: [
    CommonModule,
    ExpensesRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [DialogService],
})
export class ExpensesModule {}
