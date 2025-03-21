import { Injectable } from '@angular/core';
import { ApiService } from '../../../../services/api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReservationInventoriesService {
  constructor(private readonly apiService: ApiService) {}

  add(
    reservationId: number,
    lockerId: number,
    quantity: number,
  ): Observable<void> {
    return this.apiService.post(
      `reservations/${reservationId}/inventories/${lockerId}`,
      {
        quantity,
      },
    );
  }

  remove(
    reservationId: number,
    inventoryId: number,
    quantity: number,
  ): Observable<void> {
    return this.apiService.delete(
      `reservations/${reservationId}/inventories/${inventoryId}/quantity/${quantity}`,
    );
  }
}
