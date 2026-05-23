import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';
import { showError } from '../../utils/notifications';
import { AuthService } from './auth.service';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);
  const messageService = inject(MessageService);
  const authService = inject(AuthService);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const status = error.status;

      if (status === 419) {
        showError(messageService, 'Tu sesión ha expirado por seguridad');
        authService.clearLocalSession();
        void router.navigate(['/auth/login']);
        return throwError(() => error);
      }

      if (status === 403) {
        if (error.error?.error === 'PASSWORD_CHANGE_REQUIRED') {
          void router.navigate(['/change-password']);
          return throwError(() => error);
        }

        const raw = error.error?.message || error.error?.error;
        const backendMessage = Array.isArray(raw) ? raw[0] : raw;
        showError(messageService, backendMessage || 'Acceso denegado');
        void router.navigate(['/']);
        return throwError(() => error);
      }

      if (status === 422) {
        const raw = error.error?.message || error.error?.error;
        const backendMessage = Array.isArray(raw) ? raw[0] : raw;
        showError(messageService, backendMessage || 'Error de validación');
        return throwError(() => error);
      }

      if (status >= 500) {
        const raw = error.error?.message || error.error?.error;
        const backendMessage = Array.isArray(raw) ? raw[0] : raw;
        console.error('[HTTP 5xx]', {
          status,
          url: request.url,
          backendMessage,
          error,
        });
        showError(
          messageService,
          'Error interno del servidor. Por favor, contacte a soporte técnico',
        );
        return throwError(() => error);
      }

      return throwError(() => error);
    }),
  );
};
