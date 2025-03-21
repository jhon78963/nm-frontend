import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/layout/app.layout.component';
import { authGuard } from './auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./private/private.module').then(m => m.PrivateModule),
      },
    ],
  },
  {
    path: 'auth',
    data: { breadcrumb: 'Auth' },
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule),
  },
  {
    path: 'notfound',
    loadChildren: () =>
      import('./notfound/notfound.module').then(m => m.NotfoundModule),
  },
  { path: '', pathMatch: 'full', redirectTo: '' },
  { path: '**', redirectTo: '/notfound' },
];
