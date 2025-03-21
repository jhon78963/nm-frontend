import { Injectable } from '@angular/core';
import { ApiService } from '../../../../services/api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReservationPaymentTypesService {
  constructor(private readonly apiService: ApiService) {}

  add(
    reservationId: number,
    paymentTypeId: number,
    payment: number,
    cashPayment: number,
    cardPayment: number,
    isReservationPayment: boolean,
  ): Observable<void> {
    return this.apiService.post(
      `reservations/${reservationId}/payment-types/${paymentTypeId}`,
      {
        payment,
        cashPayment,
        cardPayment,
        isReservationPayment,
      },
    );
  }

  remove(
    reservationId: number,
    paymentTypeId: number,
    payment: number,
    cash: boolean = true,
  ): Observable<void> {
    return this.apiService.delete(
      `reservations/${reservationId}/payment-types/${paymentTypeId}/payment/${payment}/create-cash/${cash}`,
    );
  }

  refund(reservationId: number, refundedAmount: number): Observable<void> {
    return this.apiService.post(
      `reservations/${reservationId}/refunded-amount/${refundedAmount}`,
      {},
    );
  }
}
