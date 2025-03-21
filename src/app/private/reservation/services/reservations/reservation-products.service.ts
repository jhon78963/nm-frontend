import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../services/api.service';

@Injectable({
  providedIn: 'root',
})
export class ReservationProductsService {
  constructor(private readonly apiService: ApiService) {}

  add(
    reservationId: number,
    productId: number,
    quantity: number,
    isPaid: boolean = false,
    isFree: boolean = false,
  ): Observable<void> {
    return this.apiService.post(
      `reservations/${reservationId}/products/${productId}`,
      {
        quantity,
        isPaid,
        isFree,
      },
    );
  }

  modify(
    reservationId: number,
    productId: number,
    quantity: number,
    isPaid: boolean = false,
    isPaidBd: boolean = false,
    isFree: boolean = false,
  ): Observable<void> {
    return this.apiService.patch(
      `reservations/${reservationId}/products/${productId}`,
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
    productId: number,
    quantity: number,
  ): Observable<void> {
    return this.apiService.delete(
      `reservations/${reservationId}/products/${productId}/quantity/${quantity}`,
    );
  }
}
