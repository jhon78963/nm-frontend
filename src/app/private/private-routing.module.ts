import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    title: 'Home',
    data: { breadcrumb: 'Home' },
    loadChildren: () => import('./home/home.module').then(m => m.HomeModule),
  },
  {
    path: 'inventories',
    title: 'Inventario',
    data: { breadcrumb: 'Inventario' },
    loadChildren: () =>
      import('./inventories/inventories.module').then(m => m.InventoriesModule),
  },
  {
    path: 'profile',
    title: 'Profile',
    data: { breadcrumb: 'Profile' },
    loadChildren: () =>
      import('./profile/profile.module').then(m => m.ProfileModule),
  },
  {
    path: 'administration',
    title: 'Administración',
    data: { breadcrumb: 'Administración' },
    loadChildren: () =>
      import('./administration/administration.module').then(
        m => m.AdministrationModule,
      ),
  },
  {
    path: 'directory',
    title: 'Directorio',
    data: { breadcrumb: 'Directorio' },
    loadChildren: () =>
      import('./directory/directory.module').then(m => m.DirectoryModule),
  },
  {
    path: 'pos',
    title: 'POS',
    data: { breadcrumb: 'POS' },
    loadChildren: () => import('./sales/pos/pos.module').then(m => m.PosModule),
  },
  {
    path: 'financial-summary',
    title: 'Resumen Financiero',
    data: { breadcrumb: 'Resumen Financiero' },
    loadChildren: () =>
      import('./financial-summary/financial-summary.module').then(
        m => m.FinancialSummaryModule,
      ),
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
