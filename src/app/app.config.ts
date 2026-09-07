import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';

import { routes } from './app.routes';
import { errorInterceptor } from './core/http/error.interceptor';
import { tokenInterceptor } from './core/auth/token.interceptor';
import { warehouseInterceptor } from './core/warehouse/warehouse.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(
      withInterceptors([
        warehouseInterceptor,
        errorInterceptor,
        tokenInterceptor, // Más cercano al HTTP: captura 401 y refresca antes que errorInterceptor
      ]),
    ),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
};
