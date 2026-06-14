import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { permissionGuard } from '../../auth/guards/permission.guard';

const routes: Routes = [
  {
    path: 'multimedia',
    title: 'Multimedia',
    canActivate: [permissionGuard],
    data: {
      breadcrumb: 'Multimedia',
      permission: 'product.update',
    },
    loadComponent: () =>
      import('../inventories/products/pages/multimedia/product-multimedia.component').then(
        m => m.ProductMultimediaComponent,
      ),
  },
  {
    path: 'products',
    title: 'Publicar productos',
    canActivate: [permissionGuard],
    data: {
      breadcrumb: 'Publicar productos',
      permission: 'product.update',
    },
    loadComponent: () =>
      import('./pages/publish/ecommerce-publish.component').then(
        m => m.EcommercePublishComponent,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'products' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EcommerceRoutingModule {}
