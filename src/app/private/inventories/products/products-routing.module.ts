import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { permissionGuard } from '../../../auth/guards/permission.guard';

const routes: Routes = [
  {
    path: 'step',
    loadComponent: () =>
      import('./pages/form/form.component').then(c => c.StepperFormComponent),
    children: [
      { path: '', redirectTo: 'general', pathMatch: 'full' },
      {
        path: 'general',
        canActivate: [permissionGuard],
        data: { permission: 'product.create' },
        loadComponent: () =>
          import('./pages/form/products/products-form.component').then(
            c => c.ProductsFormComponent,
          ),
      },
      {
        path: 'general/:id',
        canActivate: [permissionGuard],
        data: { permission: 'product.get' },
        loadComponent: () =>
          import('./pages/form/products/products-form.component').then(
            c => c.ProductsFormComponent,
          ),
      },
      {
        path: 'sizes/:id',
        canActivate: [permissionGuard],
        data: {
          permissions: ['productSize.add', 'productSize.modify'],
        },
        loadComponent: () =>
          import('./pages/form/sizes/sizes-form.component').then(
            c => c.SizesFormComponent,
          ),
      },
      {
        path: 'colors/:id',
        canActivate: [permissionGuard],
        data: {
          permissions: ['productSizeColor.add', 'productSizeColor.modify'],
        },
        loadComponent: () =>
          import('./pages/form/colors/colors-form.component').then(
            c => c.ColorsFormComponent,
          ),
      },
      {
        path: 'ecommerce/:id',
        canActivate: [permissionGuard],
        data: { permission: 'product.update' },
        loadComponent: () =>
          import('./pages/form/ecommerce/ecommerce-form.component').then(
            c => c.EcommerceFormComponent,
          ),
      },
      {
        path: 'history/:id',
        canActivate: [permissionGuard],
        data: { permission: 'productHistory.index' },
        loadComponent: () =>
          import(
            './pages/form/products-history/products-history.component'
          ).then(c => c.ProductHistoryComponent),
      },
    ],
  },
  {
    path: 'kardex/:id',
    title: 'Kardex',
    canActivate: [permissionGuard],
    data: { breadcrumb: 'Kardex', permission: 'inventoryKardex.index' },
    loadComponent: () =>
      import('./pages/kardex/product-kardex.component').then(
        c => c.ProductKardexComponent,
      ),
  },
  {
    path: '',
    canActivate: [permissionGuard],
    data: { permission: 'product.getAll' },
    loadComponent: () =>
      import('./pages/list/products.component').then(
        c => c.ProductListComponent,
      ),
  },
  {
    path: 'edit/:id',
    canActivate: [permissionGuard],
    data: { permission: 'product.update' },
    loadComponent: () =>
      import('./pages/form/products/products-form.component').then(
        c => c.ProductsFormComponent,
      ),
  },
  // {
  //   path: 'sizes/:id',
  //   loadComponent: () =>
  //     import('./pages/form/sizes/sizes-form.component').then(
  //       c => c.SizesFormComponent,
  //     ),
  // },
  // {
  //   path: 'colors/:id',
  //   loadComponent: () =>
  //     import('./pages/form/colors/colors-form.component').then(
  //       c => c.ColorsFormComponent,
  //     ),
  // },
  // {
  //   path: 'ecommerce/:id',
  //   loadComponent: () =>
  //     import('./pages/form/ecommerce/ecommerce-form.component').then(
  //       c => c.EcommerceFormComponent,
  //     ),
  // },
  // {
  //   path: 'history/:id',
  //   loadComponent: () =>
  //     import('./pages/form/products-history/products-history.component').then(
  //       c => c.ProductHistoryComponent,
  //     ),
  // },
  { path: '', pathMatch: 'full', redirectTo: 'products' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProductsRoutingModule {}
