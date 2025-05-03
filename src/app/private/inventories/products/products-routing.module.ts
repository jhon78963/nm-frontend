import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'step',
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
          import('./pages/form/sizes/sizes-form.component').then(
            c => c.SizesFormComponent,
          ),
      },
      {
        path: 'colors/:id',
        loadComponent: () =>
          import('./pages/form/colors/colors-form.component').then(
            c => c.ColorsFormComponent,
          ),
      },
      {
        path: 'ecommerce/:id',
        loadComponent: () =>
          import('./pages/form/ecommerce/ecommerce-form.component').then(
            c => c.EcommerceFormComponent,
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
      import('./pages/form/ecommerce/ecommerce-form.component').then(
        c => c.EcommerceFormComponent,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'products' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProductsRoutingModule {}
