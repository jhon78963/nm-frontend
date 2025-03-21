import { Injectable } from '@angular/core';
import { Locker, LockerListResponse } from '../models/locker.model';
import { BehaviorSubject, debounceTime, map, Observable } from 'rxjs';
import { ApiService } from '../../../../services/api.service';

@Injectable({
  providedIn: 'root',
})
export class LockersService {
  lockers: Locker[] = [];
  lockers$: BehaviorSubject<Locker[]> = new BehaviorSubject<Locker[]>(
    this.lockers,
  );

  lockersToChange: Locker[] = [];
  lockersToChange$: BehaviorSubject<Locker[]> = new BehaviorSubject<Locker[]>(
    this.lockersToChange,
  );

  total: number = 0;
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  constructor(private apiService: ApiService) {}

  callGetList(
    limit: number = 10,
    page: number = 1,
    name: string = '',
  ): Observable<void> {
    let url = `lockers?limit=${limit}&page=${page}`;
    if (name) {
      url += `&search=${name}`;
    }
    return this.apiService.get<LockerListResponse>(url).pipe(
      debounceTime(600),
      map((response: LockerListResponse) => {
        this.updateLockers(response.data);
        this.updateTotalLockers(response.paginate.total);
      }),
    );
  }

  update(price: number): Observable<void> {
    return this.apiService.post(`lockers/price`, { price });
  }

  change(
    reservationId: number,
    lockerId: number,
    newLockerId: number,
  ): Observable<void> {
    return this.apiService.post(
      `reservations/${reservationId}/lockers/${lockerId}/new-lockers/${newLockerId}`,
      {},
    );
  }

  changeToRoom(
    reservationId: number,
    lockerId: number,
    newRoomId: number,
    newPrice: number,
    oldPrice: number,
  ): Observable<void> {
    return this.apiService.post(
      `reservations/${reservationId}/lockers/${lockerId}/new-rooms/${newRoomId}/new-price/${newPrice}/old-price/${oldPrice}`,
      {},
    );
  }

  getList(): Observable<Locker[]> {
    return this.lockers$.asObservable();
  }

  getTotal(): Observable<number> {
    return this.total$.asObservable();
  }

  getLockersAvailable(): Observable<void> {
    return this.apiService.get<any>(`lockers/available`).pipe(
      debounceTime(600),
      map((response: any) => {
        this.updateLockersToChange(response);
      }),
    );
  }

  getAvailableList(): Observable<Locker[]> {
    return this.lockersToChange$.asObservable();
  }

  private updateLockers(locker: Locker[]): void {
    this.lockers = locker;
    this.lockers$.next(this.lockers);
  }

  private updateLockersToChange(locker: Locker[]): void {
    this.lockersToChange = locker;
    this.lockersToChange$.next(this.lockersToChange);
  }

  private updateTotalLockers(total: number): void {
    this.total = total;
    this.total$.next(this.total);
  }
}
