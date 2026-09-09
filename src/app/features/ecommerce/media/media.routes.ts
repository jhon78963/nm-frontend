import { Routes } from '@angular/router';
import { roleGuard } from '../../../core/auth/role.guard';

const routes: Routes = [
  {
    path: '',
    title: 'Media',
    data: {
      breadcrumb: 'Media',
      roles: ['Admin', 'Super Admin'],
    },
    canActivate: [roleGuard],
    loadComponent: () =>
      import('./components/media-library-page/media-library-page.component').then(
        (m) => m.MediaLibraryPageComponent,
      ),
  },
];

export default routes;
