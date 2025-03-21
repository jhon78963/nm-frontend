import { Injectable } from '@angular/core';
import { Facility, FacilityCount } from '../models/facility.model';
import {
  BehaviorSubject,
  debounceTime,
  map,
  Observable,
  switchMap,
} from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { StatusLocker } from '../../facility/locker/models/locker.model';

@Injectable({
  providedIn: 'root',
})
export class FacilitiesService {
  facilities: Facility[] = [];
  facilities$: BehaviorSubject<Facility[]> = new BehaviorSubject<Facility[]>(
    this.facilities,
  );

  count: number = 0;
  count$: BehaviorSubject<number> = new BehaviorSubject<number>(this.count);

  constructor(private apiService: ApiService) {}

  callGetList(): Observable<void> {
    return this.apiService.get<Facility[]>('reservations/facilities').pipe(
      debounceTime(600),
      map((facility: Facility[]) => {
        this.updateFacilities(facility);
      }),
    );
  }

  getList(): Observable<Facility[]> {
    return this.facilities$.asObservable();
  }

  getCount(): Observable<number> {
    return this.count$.asObservable();
  }

  changeLockerStatus(id: number, data: StatusLocker) {
    return this.apiService
      .patch(`lockers/change-status/${id}`, data)
      .pipe(switchMap(() => this.callGetList()));
  }

  changeRoomStatus(id: number, data: StatusLocker) {
    return this.apiService
      .patch(`rooms/change-status/${id}`, data)
      .pipe(switchMap(() => this.callGetList()));
  }

  countFacilities(): Observable<void> {
    return this.apiService
      .get<FacilityCount>('reservations/facilities/count')
      .pipe(
        map((facility: FacilityCount) => {
          this.updateCountFacilities(facility.count);
        }),
      );
  }

  updateCountFacilities(count: number): void {
    this.count = count;
    this.count$.next(count);
  }

  private updateFacilities(value: Facility[]): void {
    this.facilities = value;
    this.facilities$.next(this.facilities);
  }
}
