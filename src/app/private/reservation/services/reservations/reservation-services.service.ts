import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../services/api.service';

@Injectable({
  providedIn: 'root',
})
export class ReservationServicesService {
  constructor(private readonly apiService: ApiService) {}

  add(
    reservationId: number,
    serviceId: number,
    quantity: number,
    isPaid: boolean = false,
    isFree: boolean = false,
  ): Observable<void> {
    return this.apiService.post(
      `reservations/${reservationId}/services/${serviceId}`,
      {
        quantity,
        isPaid,
        isFree,
      },
    );
  }

  modify(
    reservationId: number,
    serviceId: number,
    quantity: number,
    isPaid: boolean = false,
    isPaidBd: boolean = false,
    isFree: boolean = false,
  ): Observable<void> {
    return this.apiService.patch(
      `reservations/${reservationId}/services/${serviceId}`,
      {
        quantity,
        isPaid,
        isPaidBd,
        isFree,
      },
    );
  }

  remove(
    reservationId: number,
    serviceId: number,
    quantity: number,
  ): Observable<void> {
    return this.apiService.delete(
      `reservations/${reservationId}/services/${serviceId}/quantity/${quantity}`,
    );
  }
}
