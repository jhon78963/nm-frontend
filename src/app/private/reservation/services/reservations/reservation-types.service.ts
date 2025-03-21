import { Injectable } from '@angular/core';
import { ApiService } from '../../../../services/api.service';
import { map, Observable } from 'rxjs';
import {
  ReservationType,
  ReservationTypeResponse,
} from '../../models/reservation-type.model';

@Injectable({
  providedIn: 'root',
})
export class ReservationTypesService {
  constructor(private apiService: ApiService) {}

  getReservationTypes(): Observable<ReservationType[]> {
    return this.apiService.get(`reservations/reservationTypes`);
  }

  getReservationTypesLegacy(): Observable<ReservationType[]> {
    return this.apiService
      .get<ReservationTypeResponse>(`reservation-types`)
      .pipe(map((response: ReservationTypeResponse) => response.data));
  }
}
