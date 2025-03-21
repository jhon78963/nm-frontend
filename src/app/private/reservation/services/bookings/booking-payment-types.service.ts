import { Injectable } from '@angular/core';
import { ApiService } from '../../../../services/api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BookingPaymentTypesService {
  constructor(private readonly apiService: ApiService) {}

  add(
    bookingId: number,
    paymentTypeId: number,
    payment: number,
    cashPayment: number,
    cardPayment: number,
  ): Observable<void> {
    return this.apiService.post(
      `bookings/${bookingId}/payment-types/${paymentTypeId}`,
      {
        payment,
        cashPayment,
        cardPayment,
      },
    );
  }

  remove(
    bookingId: number,
    paymentTypeId: number,
    payment: number,
    cashPayment: number,
    cardPayment: number,
  ): Observable<void> {
    return this.apiService.delete(
      `bookings/${bookingId}/payment-types/${paymentTypeId}/payment/${payment}cash-payment/${cashPayment}/card-payment/${cardPayment}`,
    );
  }
}
