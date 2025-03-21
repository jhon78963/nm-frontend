import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../services/api.service';

@Injectable({
  providedIn: 'root',
})
export class BookingRoomsService {
  constructor(private readonly apiService: ApiService) {}

  add(
    bookingId: number,
    roomId: number,
    price: number,
    isPaid: boolean = false,
    additionalPeople: number = 0,
  ): Observable<void> {
    return this.apiService.post(`bookings/${bookingId}/rooms/${roomId}`, {
      price,
      isPaid,
      additionalPeople,
    });
  }

  modify(
    bookingId: number,
    roomId: number,
    isPaid: boolean = false,
    additionalPeople: number = 0,
  ): Observable<void> {
    return this.apiService.patch(`bookings/${bookingId}/rooms/${roomId}`, {
      isPaid,
      additionalPeople,
    });
  }

  remove(bookingId: number, roomId: number, price: number): Observable<void> {
    return this.apiService.delete(
      `bookings/${bookingId}/rooms/${roomId}/price/${price}`,
    );
  }
}
