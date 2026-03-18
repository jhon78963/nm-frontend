import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    title: 'Lista',
    data: { breadcrumb: 'Lista' },
    loadComponent: () =>
      import('./pages/list/list.component').then(c => c.OrderListComponent),
  },
  {
    path: 'register',
    title: 'Registro',
    data: { breadcrumb: 'Registro' },
    loadComponent: () =>
      import('./pages/form/form.component').then(c => c.OrderFormComponent),
  },
  {
    path: 'edit/:id',
    title: 'Editar',
    data: { breadcrumb: 'Editar' },
    loadComponent: () =>
      import('./pages/form/form.component').then(c => c.OrderFormComponent),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrdersRoutingModule {}
