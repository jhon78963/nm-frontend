// import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
// import { inject } from '@angular/core';
// import { Router } from '@angular/router';
// import { Subject, catchError, switchMap, throwError } from 'rxjs';
// import { AuthService } from './auth.service';

// let refreshTokenInProgress = false;
// let refreshTokenSubject: Subject<any> = new Subject<any>();

// export const tokenInterceptor: HttpInterceptorFn = (request, next) => {
//   const authService = inject(AuthService);
//   const router = inject(Router);
//   const excludedEndpoints: string[] = ['login'];
//   const excludedEndpointsAfterRefresh: string[] = ['refresh-token', 'logout'];
//   const tokenData = JSON.parse(localStorage.getItem('tokenData') || '{}');

//   if (excludedEndpoints.some(endpoint => request.url.includes(endpoint))) {
//     return next(request);
//   }

//   if (tokenData && tokenData.token) {
//     request = request.clone({
//       setHeaders: {
//         Authorization: `Bearer ${tokenData.token}`,
//       },
//     });
//   }

//   return next(request).pipe(
//     catchError((error: HttpErrorResponse) => {
//       if (
//         error.status === 401 &&
//         !excludedEndpointsAfterRefresh.some(endpoint =>
//           request.url.includes(endpoint),
//         ) &&
//         tokenData &&
//         tokenData.refreshToken
//       ) {
//         if (refreshTokenInProgress) {
//           return refreshTokenSubject.pipe(
//             switchMap(token => {
//               return next(
//                 request.clone({
//                   setHeaders: {
//                     Authorization: `Bearer ${token}`,
//                   },
//                 }),
//               );
//             }),
//           );
//         } else {
//           refreshTokenInProgress = true;
//           refreshTokenSubject = new Subject<any>();
//           return authService
//             .refreshToken(tokenData.refreshToken, tokenData.token)
//             .pipe(
//               switchMap((response: any) => {
//                 refreshTokenInProgress = false;
//                 refreshTokenSubject.next(response.token);
//                 refreshTokenSubject.complete();

//                 localStorage.setItem('tokenData', JSON.stringify(response));

//                 return next(
//                   request.clone({
//                     setHeaders: {
//                       Authorization: `Bearer ${response.token}`,
//                     },
//                   }),
//                 );
//               }),
//               catchError(refreshError => {
//                 refreshTokenInProgress = false;
//                 refreshTokenSubject.error(refreshError);
//                 console.error('Error refreshing token:', refreshError);
//                 localStorage.clear();
//                 router.navigate(['auth']);
//                 return throwError(() => refreshError);
//               }),
//             );
//         }
//       }
//       return throwError(() => error);
//     }),
//   );
// };
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

let refreshTokenInProgress = false;
let refreshTokenSubject: Subject<any> = new Subject<any>();

function readTokenDataFromStorage(): {
  token?: string;
  refreshToken?: string;
} {
  try {
    return JSON.parse(localStorage.getItem('tokenData') || '{}');
  } catch {
    return {};
  }
}

function clearAuthSession(): void {
  localStorage.removeItem('tokenData');
  localStorage.removeItem('user');
  localStorage.removeItem('selectedSize');
}

/** Rutas API (relativas a BASE_URL) sin Bearer. */
const ENDPOINTS_WITHOUT_BEARER = ['auth/login', 'auth/register'] as const;

/** Rutas API en las que un 401 no debe disparar refresh automático. */
const ENDPOINTS_WITHOUT_REFRESH_ON_401 = [
  'auth/refresh-token',
  'auth/logout',
] as const;

/**
 * Coincidencia estricta por pathname (evita falsos positivos de `.includes()`
 * p. ej. `.../catalog/login-history` al buscar `login`).
 */
function requestUrlMatchesApiPath(requestUrl: string, apiPath: string): boolean {
  const normalized = apiPath.replace(/^\/+|\/+$/g, '');
  const suffix = `/${normalized}`;

  try {
    const pathname = new URL(requestUrl).pathname.replace(/\/+$/, '') || '/';
    return pathname === suffix || pathname.endsWith(suffix);
  } catch {
    const path = requestUrl.split('?')[0]?.replace(/\/+$/, '') || '/';
    return path === suffix || path.endsWith(suffix);
  }
}

function matchesAnyApiPath(
  requestUrl: string,
  paths: readonly string[],
): boolean {
  return paths.some(path => requestUrlMatchesApiPath(requestUrl, path));
}

export const tokenInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const tokenData = readTokenDataFromStorage();
  const hasCustomTokenFlag = request.headers.has('X-Use-Custom-Token');

  if (hasCustomTokenFlag) {
    const cleanedHeaders = request.headers.delete('X-Use-Custom-Token');
    request = request.clone({ headers: cleanedHeaders });
  }

  if (matchesAnyApiPath(request.url, ENDPOINTS_WITHOUT_BEARER)) {
    return next(request);
  }

  const alreadyHasAuthorization = request.headers.has('Authorization');
  if (
    !hasCustomTokenFlag &&
    !alreadyHasAuthorization &&
    tokenData &&
    tokenData.token
  ) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${tokenData.token}`,
      },
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const is401 = error.status === 401;
      const isNotExcludedAfterRefresh = !matchesAnyApiPath(
        request.url,
        ENDPOINTS_WITHOUT_REFRESH_ON_401,
      );
      const currentTokenData = readTokenDataFromStorage();
      const hasRefreshToken = Boolean(currentTokenData.refreshToken);

      if (is401 && isNotExcludedAfterRefresh && hasRefreshToken) {
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
            .refreshToken(
              currentTokenData.refreshToken ?? null,
              currentTokenData.token ?? null,
            )
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
                clearAuthSession();
                void router.navigate(['/auth/login']);
                return throwError(() => refreshError);
              }),
            );
        }
      }

      return throwError(() => error);
    }),
  );
};
