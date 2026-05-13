import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'reconciliation/:productId',
    title: 'Cuadre de inventario',
    data: { breadcrumb: 'Cuadre de inventario' },
    loadComponent: () =>
      import(
        './inventory-reconciliation/inventory-reconciliation.component'
      ).then(m => m.InventoryReconciliationComponent),
  },
  {
    path: 'reconciliation',
    title: 'Cuadre de inventario',
    data: { breadcrumb: 'Cuadre de inventario' },
    loadComponent: () =>
      import(
        './inventory-reconciliation/inventory-reconciliation.component'
      ).then(m => m.InventoryReconciliationComponent),
  },
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
  {
    path: 'purchase',
    title: 'Compras',
    data: { breadcrumb: 'Compras' },
    loadChildren: () =>
      import('./purchase/purchase.module').then(m => m.PurchaseModule),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InventoriesRoutingModule {}
