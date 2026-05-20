import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

/**
 * Rutas de uso general (home, perfil).
 * Rutas sensibles (directory, sales, finance, financial-summary) viven en app.routes.ts
 * con roleGuard y roles de administración.
 */
const routes: Routes = [
  {
    path: '',
    title: 'Home',
    data: { breadcrumb: 'Home' },
    loadChildren: () => import('./home/home.module').then(m => m.HomeModule),
  },
  {
    path: 'profile',
    title: 'Profile',
    data: { breadcrumb: 'Profile' },
    loadChildren: () =>
      import('./profile/profile.module').then(m => m.ProfileModule),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
    data: { breadcrumb: 'Home' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PrivateRoutingModule {}
