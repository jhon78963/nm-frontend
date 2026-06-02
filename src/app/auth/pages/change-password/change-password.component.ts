import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { finalize } from 'rxjs';
import { showError, showSuccess } from '../../../utils/notifications';
import { AuthService } from '../../services/auth.service';
import {
  newPasswordValidators,
  passwordValidationMessage,
} from '../../validators/password.validators';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    PasswordModule,
    ToastModule,
  ],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss',
  providers: [MessageService],
})
export class ChangePasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);

  loading = false;

  readonly form: FormGroup = this.fb.group({
    currentPassword: [null, [Validators.required]],
    password: [null, newPasswordValidators],
    passwordConfirmation: [null, newPasswordValidators],
  });

  fieldError(controlName: string): string | null {
    const control = this.form.get(controlName);
    if (!control || !(control.touched || control.dirty) || !control.invalid) {
      return null;
    }

    if (controlName === 'currentPassword' && control.errors?.['required']) {
      return 'La contraseña actual es obligatoria.';
    }

    if (
      controlName === 'password' ||
      controlName === 'passwordConfirmation'
    ) {
      return passwordValidationMessage(control);
    }

    return null;
  }

  passwordHint(): string {
    return 'Mínimo 12 caracteres, con mayúsculas, minúsculas, números y símbolos.';
  }

  submit(): void {
    if (this.form.invalid || this.loading) {
      return;
    }

    const { currentPassword, password, passwordConfirmation } = this.form.value;

    if (password !== passwordConfirmation) {
      showError(
        this.messageService,
        'La confirmación de la nueva contraseña no coincide.',
      );
      return;
    }

    this.loading = true;

    this.authService
      .changePassword({ currentPassword, password, passwordConfirmation })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          showSuccess(
            this.messageService,
            'Contraseña actualizada. Ya puedes usar el sistema.',
          );
        },
        error: (err: unknown) => {
          showError(this.messageService, this.resolveErrorMessage(err));
        },
      });
  }

  signOut(): void {
    this.authService.signOut().subscribe();
  }

  private resolveErrorMessage(err: unknown): string {
    if (typeof err === 'string' && err.trim()) {
      return err;
    }

    const http = err as {
      error?: { message?: string | string[] };
      message?: string;
    };

    const raw = http?.error?.message;
    if (Array.isArray(raw)) {
      return raw[0] ?? 'No se pudo cambiar la contraseña.';
    }

    if (typeof raw === 'string' && raw.trim()) {
      return raw;
    }

    return http?.message ?? 'No se pudo cambiar la contraseña.';
  }
}
