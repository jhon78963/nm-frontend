import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../services/api.service';

@Injectable({
  providedIn: 'root',
})
export class ReservationLockersService {
  constructor(private readonly apiService: ApiService) {}

  add(
    reservationId: number,
    lockerId: number,
    price: number,
    isPaid: boolean = false,
    consumption: number = 0,
  ): Observable<void> {
    return this.apiService.post(
      `reservations/${reservationId}/lockers/${lockerId}`,
      {
        price,
        isPaid,
        consumption,
      },
    );
  }

  modify(
    reservationId: number,
    lockerId: number,
    isPaid: boolean = false,
    consumption: number = 0,
  ): Observable<void> {
    return this.apiService.patch(
      `reservations/${reservationId}/lockers/${lockerId}`,
      {
        isPaid,
        consumption,
      },
    );
  }

  remove(
    reservationId: number,
    lockerId: number,
    price: number,
  ): Observable<void> {
    return this.apiService.delete(
      `reservations/${reservationId}/lockers/${lockerId}/price/${price}`,
    );
  }

  updateConsumption(
    reservationId: number,
    lockerId: number,
    consumption: number,
  ): Observable<void> {
    return this.apiService.post(
      `reservations/${reservationId}/lockers/${lockerId}/consumption/${consumption}`,
      {},
    );
  }
}
