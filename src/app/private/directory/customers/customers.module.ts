import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomersRoutingModule } from './customers-routing.module';
import { SharedModule } from '../../../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogService } from 'primeng/dynamicdialog';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CustomerListComponent } from './pages/list/customers.component';
import { CustomerFormComponent } from './pages/form/customers-form.component';

@NgModule({
  declarations: [CustomerListComponent, CustomerFormComponent],
  imports: [
    CommonModule,
    CustomersRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    ToastModule,
    ConfirmDialogModule,
    RadioButtonModule,
  ],
  providers: [DialogService],
})
export class CustomersModule {}
