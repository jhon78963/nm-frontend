import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReservationRoutingModule } from './reservation-routing.module';
import { DialogService } from 'primeng/dynamicdialog';

@NgModule({
  declarations: [],
  imports: [CommonModule, ReservationRoutingModule],
  providers: [DialogService],
})
export class ReservationModule {}
