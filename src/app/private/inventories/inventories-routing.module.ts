import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { permissionGuard } from '../../auth/guards/permission.guard';

const routes: Routes = [
  {
    path: 'reconciliation/:productId',
    title: 'Cuadre de inventario',
    canActivate: [permissionGuard],
    data: {
      breadcrumb: 'Cuadre de inventario',
      permission: 'inventoryReconciliation.search',
    },
    loadComponent: () =>
      import(
        './inventory-reconciliation/inventory-reconciliation.component'
      ).then(m => m.InventoryReconciliationComponent),
  },
  {
    path: 'reconciliation',
    title: 'Cuadre de inventario',
    canActivate: [permissionGuard],
    data: {
      breadcrumb: 'Cuadre de inventario',
      permission: 'inventoryReconciliation.search',
    },
    loadComponent: () =>
      import(
        './inventory-reconciliation/inventory-reconciliation.component'
      ).then(m => m.InventoryReconciliationComponent),
  },
  {
    path: 'products',
    title: 'Productos',
    canActivate: [permissionGuard],
    data: {
      breadcrumb: 'Productos',
      permissions: ['product.getAll', 'product.get'],
    },
    loadChildren: () =>
      import('./products/products.module').then(m => m.ProductsModule),
  },
  {
    path: 'sizes',
    title: 'Tallas',
    canActivate: [permissionGuard],
    data: {
      breadcrumb: 'Tallas',
      permissions: ['size.getAll', 'size.get'],
    },
    loadChildren: () => import('./sizes/sizes.module').then(m => m.SizesModule),
  },
  {
    path: 'colors',
    title: 'Colores',
    canActivate: [permissionGuard],
    data: {
      breadcrumb: 'Colores',
      permissions: ['color.getAll', 'color.get'],
    },
    loadChildren: () =>
      import('./colors/colors.module').then(m => m.ColorsModule),
  },
  {
    path: 'purchase',
    title: 'Compras',
    canActivate: [permissionGuard],
    data: {
      breadcrumb: 'Compras',
      permissions: ['purchase.getAll', 'purchase.get'],
    },
    loadChildren: () =>
      import('./purchase/purchase.module').then(m => m.PurchaseModule),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InventoriesRoutingModule {}
