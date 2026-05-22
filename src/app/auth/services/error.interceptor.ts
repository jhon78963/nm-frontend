import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';
import { showError } from '../../utils/notifications';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);
  const messageService = inject(MessageService);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const status = error.status;

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
        showError(
          messageService,
          backendMessage || 'Error interno del servidor',
        );
        return throwError(() => error);
      }

      return throwError(() => error);
    }),
  );
};
