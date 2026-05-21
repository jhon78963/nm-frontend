import { AuthService } from './../../services/auth.service';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { showError } from '../../../utils/notifications';
import { Login } from '../../interfaces';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  providers: [MessageService],
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);

  loading = false;

  public myForm: FormGroup = this.fb.group({
    username: [null, [Validators.required]],
    password: [null, [Validators.required, Validators.minLength(8)]],
  });

  login(): void {
    if (this.myForm.invalid || this.loading) {
      return;
    }

    const body: Login = this.myForm.value;
    this.loading = true;

    this.authService
      .login(body)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        error: (err: unknown) => {
          const message = this.resolveLoginErrorMessage(err);
          console.error('Login failed:', err);
          showError(this.messageService, message);
        },
      });
  }

  private resolveLoginErrorMessage(err: unknown): string {
    if (typeof err === 'string' && err.trim()) {
      return err;
    }
    return 'Credenciales inválidas. Verifica tu usuario y contraseña.';
  }
}
