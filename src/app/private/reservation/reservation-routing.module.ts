import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'book',
    loadComponent: () =>
      import('./pages/reservation/reservation.component').then(
        c => c.ReservationComponent,
      ),
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./pages/list/reservation.component').then(
        c => c.ReservationListComponent,
      ),
  },
  {
    path: 'booking',
    loadComponent: () =>
      import('./pages/booking/booking.component').then(c => c.BookingComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: 'book' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReservationRoutingModule {}
