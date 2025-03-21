import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../services/api.service';

@Injectable({
  providedIn: 'root',
})
export class BookingProductsService {
  constructor(private readonly apiService: ApiService) {}

  add(
    bookingId: number,
    productId: number,
    quantity: number,
    isPaid: boolean = false,
    isFree: boolean = false,
  ): Observable<void> {
    return this.apiService.post(`bookings/${bookingId}/products/${productId}`, {
      quantity,
      isPaid,
      isFree,
    });
  }

  modify(
    bookingId: number,
    productId: number,
    quantity: number,
    isPaid: boolean = false,
    isFree: boolean = false,
  ): Observable<void> {
    return this.apiService.patch(
      `bookings/${bookingId}/products/${productId}`,
      {
        quantity,
        isPaid,
        isFree,
      },
    );
  }

  remove(
    bookingId: number,
    productId: number,
    quantity: number,
  ): Observable<void> {
    return this.apiService.delete(
      `bookings/${bookingId}/products/${productId}/quantity/${quantity}`,
    );
  }
}
