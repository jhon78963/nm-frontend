import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../services/api.service';

@Injectable({
  providedIn: 'root',
})
export class BookingServicesService {
  constructor(private readonly apiService: ApiService) {}

  add(
    bookingId: number,
    serviceId: number,
    quantity: number,
    isPaid: boolean = false,
    isFree: boolean = false,
  ): Observable<void> {
    return this.apiService.post(`bookings/${bookingId}/services/${serviceId}`, {
      quantity,
      isPaid,
      isFree,
    });
  }

  modify(
    bookingId: number,
    serviceId: number,
    quantity: number,
    isPaid: boolean = false,
    isFree: boolean = false,
  ): Observable<void> {
    return this.apiService.patch(
      `bookings/${bookingId}/services/${serviceId}`,
      {
        quantity,
        isPaid,
        isFree,
      },
    );
  }

  remove(
    bookingId: number,
    serviceId: number,
    quantity: number,
  ): Observable<void> {
    return this.apiService.delete(
      `bookings/${bookingId}/services/${serviceId}/quantity/${quantity}`,
    );
  }
}
