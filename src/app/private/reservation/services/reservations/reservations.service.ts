import { Injectable } from '@angular/core';

import { BehaviorSubject, debounceTime, map, Observable } from 'rxjs';

import { ApiService } from '../../../../services/api.service';

import {
  CreatedReservation,
  Reservation,
  ReservationListResponse,
} from '../../models/reservation.model';

@Injectable({
  providedIn: 'root',
})
export class ReservationsService {
  reservations: Reservation[] = [];
  reservations$: BehaviorSubject<Reservation[]> = new BehaviorSubject<
    Reservation[]
  >(this.reservations);

  total: number = 0;
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  constructor(private apiService: ApiService) {}

  callGetList(
    limit: number = 10,
    page: number = 1,
    reservationType: number = 0,
    schedule: number = 0,
    startDate: string | null = null,
    endDate: string | null = null,
  ): Observable<void> {
    let url = `reservations?limit=${limit}&page=${page}`;
    if (reservationType != 0) {
      url += `&reservationType=${reservationType}`;
    }
    if (schedule != 0) {
      url += `&schedule=${schedule}`;
    }
    if (startDate) {
      url += `&startDate=${startDate}`;
    }
    if (endDate) {
      url += `&endDate=${endDate}`;
    }
    return this.apiService.get<ReservationListResponse>(url).pipe(
      debounceTime(600),
      map((response: ReservationListResponse) => {
        this.updateReservations(response.data);
        this.updateTotalReservations(response.paginate.total);
      }),
    );
  }

  getList(): Observable<Reservation[]> {
    return this.reservations$.asObservable();
  }

  getTotal(): Observable<number> {
    return this.total$.asObservable();
  }

  getOne(id: number): Observable<Reservation> {
    return this.apiService.get(`reservations/${id}`);
  }

  create(data: Reservation): Observable<CreatedReservation> {
    return this.apiService.post<CreatedReservation>('reservations', data);
  }

  update(id: number, data: Reservation): Observable<void> {
    return this.apiService.patch(`reservations/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.apiService.delete(`reservations/${id}`);
  }

  private updateReservations(value: Reservation[]): void {
    this.reservations = value;
    this.reservations$.next(this.reservations);
  }

  private updateTotalReservations(value: number): void {
    this.total = value;
    this.total$.next(this.total);
  }
}
