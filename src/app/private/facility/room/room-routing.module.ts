import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoomLayoutComponent } from './layout/room.layout.component';

const routes: Routes = [
  {
    path: '',
    component: RoomLayoutComponent,
    children: [
      {
        path: 'list',
        loadComponent: () =>
          import('./rooms/pages/list/rooms.component').then(
            c => c.RoomsComponent,
          ),
      },
      {
        path: 'room-types',
        loadComponent: () =>
          import('./room-types/pages/list/room-types.component').then(
            c => c.RoomTypesComponent,
          ),
      },
      {
        path: 'amenities',
        loadComponent: () =>
          import('./amenities/pages/list/amenities.component').then(
            c => c.AmenitiesComponent,
          ),
      },
      {
        path: 'rate',
        loadChildren: () =>
          import('./rate/rates.module').then(m => m.RatesModule),
      },
      {
        path: 'reviews',
        loadComponent: () =>
          import('./reviews/pages/list/reviews.component').then(
            c => c.ReviewsComponent,
          ),
      },
      {
        path: 'images',
        loadComponent: () =>
          import('./images/pages/list/images.component').then(
            c => c.ImagesComponent,
          ),
      },
      {
        path: '',
        redirectTo: 'rooms',
        pathMatch: 'full',
      },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'rooms' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RoomRoutingModule {}
