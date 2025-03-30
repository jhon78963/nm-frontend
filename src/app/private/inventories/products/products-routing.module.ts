import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/list/products.component').then(
        c => c.ProductListComponent,
      ),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./pages/form/products-form.component').then(
        c => c.ProductsFormComponent,
      ),
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./pages/form/products-form.component').then(
        c => c.ProductsFormComponent,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'products' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProductsRoutingModule {}
