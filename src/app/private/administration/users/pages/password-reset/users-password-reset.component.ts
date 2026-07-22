import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { finalize } from 'rxjs';
import { showError } from '../../../../../utils/notifications';
import {
  mediumPasswordValidationMessage,
  mediumPasswordValidators,
} from '../../../../../auth/validators/password.validators';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-users-password-reset',
  templateUrl: './users-password-reset.component.html',
  styleUrl: './users-password-reset.component.scss',
  providers: [MessageService],
})
export class UsersPasswordResetComponent {
  userId = 0;
  username = '';
  isSaving = false;

  readonly form: FormGroup = this.formBuilder.group({
    password: [null, mediumPasswordValidators],
    passwordConfirmation: [null, Validators.required],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly usersService: UsersService,
    private readonly dynamicDialogRef: DynamicDialogRef,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
    private readonly messageService: MessageService,
  ) {
    this.userId = this.dynamicDialogConfig.data?.id ?? 0;
    this.username = this.dynamicDialogConfig.data?.username ?? '';
  }

  get isValid(): boolean {
    return this.form.valid;
  }

  fieldError(controlName: string): string | null {
    const control = this.form.get(controlName);
    if (!control || !(control.touched || control.dirty) || !control.invalid) {
      return null;
    }

    if (
      controlName === 'passwordConfirmation' &&
      control.errors?.['required']
    ) {
      return 'La confirmación de la contraseña es obligatoria.';
    }

    return mediumPasswordValidationMessage(control);
  }

  passwordHint(): string {
    return 'Mínimo 6 caracteres. Debe alcanzar nivel medio: mayúsculas y minúsculas, o letras y números.';
  }

  buttonResetPassword(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    const { password, passwordConfirmation } = this.form.value;

    if (password !== passwordConfirmation) {
      showError(
        this.messageService,
        'La confirmación de la contraseña no coincide.',
      );
      return;
    }

    this.isSaving = true;

    this.usersService
      .resetPassword(this.userId, { password, passwordConfirmation })
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: () => this.dynamicDialogRef.close({ success: true }),
        error: (err: unknown) => this.handleSaveError(err),
      });
  }

  private handleSaveError(err: unknown): void {
    const message =
      (err as { error?: { message?: string }; message?: string })?.error
        ?.message ??
      (err as { message?: string })?.message ??
      'Error al restablecer la contraseña.';
    showError(this.messageService, message);
  }
}
