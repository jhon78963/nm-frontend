import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { TenantsRoutingModule } from './tenants-routing.module';
import { TenantsListComponent } from './pages/list/tenants.component';
import { TenantsFormComponent } from './pages/form/tenants-form.component';
import { DialogService } from 'primeng/dynamicdialog';
import { SharedModule } from '../../../shared/shared.module';

@NgModule({
  declarations: [TenantsListComponent, TenantsFormComponent],
  imports: [
    CommonModule,
    TenantsRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    ConfirmDialogModule,
    ToastModule,
    DividerModule,
  ],
  providers: [DialogService],
})
export class TenantsModule {}
