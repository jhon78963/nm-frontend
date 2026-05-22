import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { MessageService } from 'primeng/api';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { errorInterceptor } from './auth/services/error.interceptor';
import { tokenInterceptor } from './auth/services/token.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withHashLocation()),
    provideHttpClient(
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      }),
      withInterceptors([errorInterceptor, tokenInterceptor]),
    ),
    MessageService,
    importProvidersFrom([BrowserAnimationsModule]),
  ],
};
