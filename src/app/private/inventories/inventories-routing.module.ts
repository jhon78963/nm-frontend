import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'products',
    title: 'Productos',
    data: { breadcrumb: 'Productos' },
    loadChildren: () =>
      import('./products/products.module').then(m => m.ProductsModule),
  },
  {
    path: 'sizes',
    title: 'Tallas',
    data: { breadcrumb: 'Tallas' },
    loadChildren: () => import('./sizes/sizes.module').then(m => m.SizesModule),
  },
  {
    path: 'colors',
    title: 'Colores',
    data: { breadcrumb: 'Colores' },
    loadChildren: () =>
      import('./colors/colors.module').then(m => m.ColorsModule),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InventoriesRoutingModule {}
