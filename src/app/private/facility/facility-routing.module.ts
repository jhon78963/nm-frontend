import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'room',
    title: 'Habitaciones',
    data: { breadcrumb: 'Habitaciones' },
    loadChildren: () => import('./room/room.module').then(m => m.RoomModule),
  },
  {
    path: 'locker',
    title: 'Locker',
    data: { breadcrumb: 'Locker' },
    loadChildren: () =>
      import('./locker/locker.module').then(m => m.LockerModule),
  },
  {
    path: 'inventory',
    title: 'Inventario',
    data: { breadcrumb: 'Inventario' },
    loadChildren: () =>
      import('./inventory/inventory.module').then(m => m.InventoryModule),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'room',
    data: { breadcrumb: 'Habitaciones' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FacilityRoutingModule {}
