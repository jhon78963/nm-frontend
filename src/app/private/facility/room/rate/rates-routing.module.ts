import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RateLayoutComponent } from './layout/rate.layout.component';

const routes: Routes = [
  {
    path: '',
    component: RateLayoutComponent,
    children: [
      {
        path: 'list',
        loadComponent: () =>
          import('./rates/pages/list/rates.component').then(
            c => c.RatesComponent,
          ),
      },
      {
        path: 'hours',
        loadComponent: () =>
          import('./hours/pages/list/hours.component').then(
            c => c.HoursComponent,
          ),
      },
      {
        path: 'days',
        loadComponent: () =>
          import('./days/pages/list/days.component').then(c => c.DaysComponent),
      },
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RatesRoutingModule {}
