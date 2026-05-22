import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { MessageService } from 'primeng/api';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { csrfInterceptor } from './auth/services/csrf.interceptor';
import { errorInterceptor } from './auth/services/error.interceptor';
import { tokenInterceptor } from './auth/services/token.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withHashLocation()),
    provideHttpClient(
      withInterceptors([csrfInterceptor, errorInterceptor, tokenInterceptor]),
    ),
    MessageService,
    importProvidersFrom([BrowserAnimationsModule]),
  ],
};
