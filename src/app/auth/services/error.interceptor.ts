import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';
import { showError } from '../../utils/notifications';

const REFRESH_TOKEN_PATH = 'refresh-token';
const LOGOUT_PATH = 'logout';
const LOGIN_PATH = 'login';

function clearAuthStorage(): void {
  localStorage.removeItem('tokenData');
  localStorage.removeItem('user');
  localStorage.removeItem('selectedSize');
}

function readRefreshToken(): string | undefined {
  try {
    const tokenData = JSON.parse(
      localStorage.getItem('tokenData') || '{}',
    ) as { refreshToken?: string };
    return tokenData.refreshToken?.trim() || undefined;
  } catch {
    return undefined;
  }
}

function isAuthEndpoint(url: string): boolean {
  return (
    url.includes(LOGIN_PATH) ||
    url.includes(REFRESH_TOKEN_PATH) ||
    url.includes(LOGOUT_PATH)
  );
}

/** Deja que tokenInterceptor (exterior) intente refresh antes de cerrar sesión. */
function shouldDefer401ToTokenInterceptor(url: string): boolean {
  return !isAuthEndpoint(url) && Boolean(readRefreshToken());
}

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);
  const messageService = inject(MessageService);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const status = error.status;

      if (status === 401) {
        if (shouldDefer401ToTokenInterceptor(request.url)) {
          return throwError(() => error);
        }

        clearAuthStorage();
        void router.navigate(['/auth/login']);
        return throwError(() => error);
      }

      if (status === 403) {
        const backendMessage = error.error?.message || error.error?.error;
        showError(messageService, backendMessage || 'Acceso denegado');
        void router.navigate(['/']);
        return throwError(() => error);
      }

      if (status === 422) {
        const backendMessage = error.error?.message || error.error?.error;
        showError(messageService, backendMessage || 'Error de validación');
        return throwError(() => error);
      }

      if (status >= 500) {
        const backendMessage = error.error?.message || error.error?.error;
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
