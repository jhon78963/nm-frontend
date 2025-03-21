import { Injectable } from '@angular/core';
import { BehaviorSubject, debounceTime, map, Observable } from 'rxjs';
import { ApiService } from '../../../../services/api.service';
import {
  Booking,
  BookingListResponse,
  CheckSchedule,
  CreatedBooking,
} from '../../models/booking.model';

@Injectable({
  providedIn: 'root',
})
export class BookingsService {
  bookings: Booking[] = [];
  bookings$: BehaviorSubject<Booking[]> = new BehaviorSubject<Booking[]>(
    this.bookings,
  );

  total: number = 0;
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  constructor(private apiService: ApiService) {}

  callGetList(
    limit: number = 10,
    page: number = 1,
    startDate: string | null = null,
    endDate: string | null = null,
    dni: string | number | null = null,
  ): Observable<void> {
    let url = `bookings?limit=${limit}&page=${page}`;
    if (startDate) {
      url += `&startDate=${startDate}`;
    }
    if (endDate) {
      url += `&endDate=${endDate}`;
    }
    if (dni) {
      url += `&dni=${dni}`;
    }
    return this.apiService.get<BookingListResponse>(url).pipe(
      debounceTime(600),
      map((response: BookingListResponse) => {
        this.updateBookings(response.data);
        this.updateTotalBookings(response.paginate.total);
      }),
    );
  }

  getList(): Observable<Booking[]> {
    return this.bookings$.asObservable();
  }

  getTotal(): Observable<number> {
    return this.total$.asObservable();
  }

  getOne(id: number): Observable<Booking> {
    return this.apiService.get(`bookings/${id}`);
  }

  create(data: Booking): Observable<CreatedBooking> {
    return this.apiService.post<CreatedBooking>('bookings', data);
  }

  update(id: number, data: Booking): Observable<void> {
    return this.apiService.patch(`bookings/${id}`, data);
  }

  changeStatus(
    id: number,
    status: string,
    totalPaid: number,
  ): Observable<void> {
    return this.apiService.patch(`bookings/${id}`, { status, totalPaid });
  }

  checkSchedule(
    roomId: number,
    startDate: string | null,
  ): Observable<CheckSchedule> {
    return this.apiService.post(`bookings/check-schedule/room/${roomId}`, {
      startDate,
    });
  }

  delete(id: number): Observable<void> {
    return this.apiService.delete(`bookings/${id}`);
  }

  private updateBookings(value: Booking[]): void {
    this.bookings = value;
    this.bookings$.next(this.bookings);
  }

  private updateTotalBookings(value: number): void {
    this.total = value;
    this.total$.next(this.total);
  }
}
