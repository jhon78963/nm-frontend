import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { WarehousesRoutingModule } from './warehouses-routing.module';
import { WarehousesListComponent } from './pages/list/warehouses.component';
import { WarehousesFormComponent } from './pages/form/warehouses-form.component';
import { DialogService } from 'primeng/dynamicdialog';
import { SharedModule } from '../../../shared/shared.module';

@NgModule({
  declarations: [WarehousesListComponent, WarehousesFormComponent],
  imports: [
    CommonModule,
    WarehousesRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    ConfirmDialogModule,
    ToastModule,
  ],
  providers: [DialogService],
})
export class WarehousesModule {}
