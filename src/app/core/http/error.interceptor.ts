import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../shared/ui/toast/toast.service';

function readBackendMessage(error: HttpErrorResponse): string | undefined {
  const raw = error.error?.message ?? error.error?.error;
  if (Array.isArray(raw)) {
    return raw[0];
  }

  return typeof raw === 'string' ? raw : undefined;
}

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);
  const toastService = inject(ToastService);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const status = error.status;

      // 401: lo maneja tokenInterceptor (refresh + retry). No cerrar sesión aquí.
      if (status === 401) {
        return throwError(() => error);
      }

      if (status === 403) {
        if (error.error?.error === 'PASSWORD_CHANGE_REQUIRED') {
          void router.navigate(['/change-password']);
          return throwError(() => error);
        }

        toastService.show(
          'error',
          readBackendMessage(error) ?? 'Acceso denegado',
        );
        void router.navigate(['/dashboard']);
        return throwError(() => error);
      }

      if (status === 422) {
        toastService.show(
          'error',
          readBackendMessage(error) ?? 'Error de validación',
        );
        return throwError(() => error);
      }

      if (status >= 500) {
        if (!environment.production) {
          console.error('[Server Error]', error);
        }
        toastService.show(
          'error',
          'Error interno del servidor. Por favor, contacte a soporte técnico',
        );
        return throwError(() => error);
      }

      return throwError(() => error);
    }),
  );
};
