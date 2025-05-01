import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'create',
    loadComponent: () =>
      import('./pages/form/form.component').then(c => c.StepperFormComponent),
    children: [
      { path: '', redirectTo: 'general', pathMatch: 'full' },
      {
        path: 'general',
        loadComponent: () =>
          import('./pages/form/products/products-form.component').then(
            c => c.ProductsFormComponent,
          ),
      },
      {
        path: 'general/:id',
        loadComponent: () =>
          import('./pages/form/products/products-form.component').then(
            c => c.ProductsFormComponent,
          ),
      },
      {
        path: 'sizes/:id',
        loadComponent: () =>
          import('./pages/form/products/products-form.component').then(
            c => c.ProductsFormComponent,
          ),
      },
      {
        path: 'colors/:id',
        loadComponent: () =>
          import('./pages/form/products/products-form.component').then(
            c => c.ProductsFormComponent,
          ),
      },
      {
        path: 'ecommerce/:id',
        loadComponent: () =>
          import('./pages/form/products/products-form.component').then(
            c => c.ProductsFormComponent,
          ),
      },
    ],
  },
  {
    path: '',
    loadComponent: () =>
      import('./pages/list/products.component').then(
        c => c.ProductListComponent,
      ),
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./pages/form/products/products-form.component').then(
        c => c.ProductsFormComponent,
      ),
  },
  {
    path: 'ecommerce/:id',
    loadComponent: () =>
      import('./pages/form/ecommerce/products-ecommerce-form.component').then(
        c => c.ProductsEcommerceFormComponent,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'products' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProductsRoutingModule {}
