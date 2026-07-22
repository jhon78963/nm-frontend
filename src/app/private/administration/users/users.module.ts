import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UsersRoutingModule } from './users-routing.module';
import { SharedModule } from '../../../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogService } from 'primeng/dynamicdialog';
import { RadioButtonModule } from 'primeng/radiobutton';
import { UserListComponent } from './pages/list/users.component';
import { UserFormComponent } from './pages/form/users-form.component';
import { UsersPasswordResetComponent } from './pages/password-reset/users-password-reset.component';
import { PasswordModule } from 'primeng/password';

@NgModule({
  declarations: [
    UserListComponent,
    UserFormComponent,
    UsersPasswordResetComponent,
  ],
  imports: [
    CommonModule,
    UsersRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    ToastModule,
    ConfirmDialogModule,
    RadioButtonModule,
    PasswordModule,
  ],
  providers: [DialogService],
})
export class UsersModule {}
