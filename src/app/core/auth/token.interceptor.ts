import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, Observable, shareReplay, switchMap, throwError } from 'rxjs';
import { TokenStorageService } from './token-storage.service';
import { AuthService } from '../../features/auth/data-access/auth.service';

/**
 * URLs públicas donde NO inyectamos el access_token como Bearer.
 */
const PUBLIC_URL_PARTS = [
  '/auth/login',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/refresh',
];

/**
 * URLs donde un 401 es esperado: no intentar refresh automático.
 */
const REFRESH_SKIP_URL_PARTS = [
  ...PUBLIC_URL_PARTS,
  '/auth/me',
  '/auth/logout',
];

let refreshInFlight$: Observable<string> | null = null;

function isPublicUrl(url: string): boolean {
  return PUBLIC_URL_PARTS.some((part) => url.includes(part));
}

function shouldSkipRefresh(url: string): boolean {
  return REFRESH_SKIP_URL_PARTS.some((part) => url.includes(part));
}

function addBearerHeader(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
}

function refreshAccessToken(authService: AuthService): Observable<string> {
  if (!refreshInFlight$) {
    refreshInFlight$ = authService.refreshSession().pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      finalize(() => {
        refreshInFlight$ = null;
      }),
    );
  }

  return refreshInFlight$;
}

export const tokenInterceptor: HttpInterceptorFn = (request, next) => {
  const tokenStorage = inject(TokenStorageService);
  const authService = inject(AuthService);
  const router = inject(Router);

  if (isPublicUrl(request.url)) {
    return next(request);
  }

  const accessToken = tokenStorage.getAccessToken();
  const authReq = accessToken ? addBearerHeader(request, accessToken) : request;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || shouldSkipRefresh(request.url)) {
        return throwError(() => error);
      }

      return refreshAccessToken(authService).pipe(
        switchMap((newAccessToken) => next(addBearerHeader(request, newAccessToken))),
        catchError((refreshError) => {
          authService.clearLocalSession();
          void router.navigate(['/auth/login']);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
