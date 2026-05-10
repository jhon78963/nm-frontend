import { Routes } from '@angular/router';

export const TENANTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list/tenant-list.component').then(m => m.TenantListComponent),
  },
];
