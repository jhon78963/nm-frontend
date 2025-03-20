import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

let refreshTokenInProgress = false;
let refreshTokenSubject: Subject<any> = new Subject<any>();

export const tokenInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const excludedEndpoints: string[] = ['login'];
  const excludedEndpointsAfterRefresh: string[] = ['refresh-token', 'logout'];
  const tokenData = JSON.parse(localStorage.getItem('tokenData') || '{}');

  if (excludedEndpoints.some(endpoint => request.url.includes(endpoint))) {
    return next(request);
  }

  if (tokenData && tokenData.token) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${tokenData.token}`,
      },
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status === 401 &&
        !excludedEndpointsAfterRefresh.some(endpoint =>
          request.url.includes(endpoint),
        ) &&
        tokenData &&
        tokenData.refreshToken
      ) {
        if (refreshTokenInProgress) {
          return refreshTokenSubject.pipe(
            switchMap(token => {
              return next(
                request.clone({
                  setHeaders: {
                    Authorization: `Bearer ${token}`,
                  },
                }),
              );
            }),
          );
        } else {
          refreshTokenInProgress = true;
          refreshTokenSubject = new Subject<any>();
          return authService
            .refreshToken(tokenData.refreshToken, tokenData.token)
            .pipe(
              switchMap((response: any) => {
                refreshTokenInProgress = false;
                refreshTokenSubject.next(response.token);
                refreshTokenSubject.complete();

                localStorage.setItem('tokenData', JSON.stringify(response));

                return next(
                  request.clone({
                    setHeaders: {
                      Authorization: `Bearer ${response.token}`,
                    },
                  }),
                );
              }),
              catchError(refreshError => {
                refreshTokenInProgress = false;
                refreshTokenSubject.error(refreshError);
                console.error('Error refreshing token:', refreshError);
                localStorage.clear();
                router.navigate(['auth']);
                return throwError(() => refreshError);
              }),
            );
        }
      }
      return throwError(() => error);
    }),
  );
};
