import { HttpInterceptorFn } from '@angular/common/http';

export const tokenInterceptor: HttpInterceptorFn = (request, next) => {
  let authReq = request.clone({ withCredentials: true });

  if (request.headers.has('X-Use-Custom-Token')) {
    authReq = authReq.clone({
      headers: authReq.headers.delete('X-Use-Custom-Token'),
    });
  }

  return next(authReq);
};
