import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import { ExpensesRoutingModule } from './expenses-routing.module';
import { SharedModule } from '../../../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogService } from 'primeng/dynamicdialog';
import { ExpenseListComponent } from './pages/list/expenses.component';
import { ExpenseFormComponent } from './pages/form/expenses-form.component';
import { ConfirmationService, MessageService } from 'primeng/api';

@NgModule({
  declarations: [ExpenseListComponent, ExpenseFormComponent],
  imports: [
    CommonModule,
    ConfirmDialogModule,
    ExpensesRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    ToastModule,
  ],
  providers: [ConfirmationService, DatePipe, DialogService, MessageService],
})
export class ExpensesModule {}
