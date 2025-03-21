import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  debounceTime,
  map,
  Observable,
  switchMap,
} from 'rxjs';

import { Hour, HourListResponse } from '../models/hours.model';

import { ApiService } from '../../../../../../services/api.service';

@Injectable({
  providedIn: 'root',
})
export class HoursService {
  hours: Hour[] = [];
  total: number = 0;
  hours$: BehaviorSubject<Hour[]> = new BehaviorSubject<Hour[]>(this.hours);
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  constructor(private readonly apiService: ApiService) {}

  callGetList(
    limit: number = 10,
    page: number = 1,
    name: string = '',
  ): Observable<void> {
    let url = `rate-hours?limit=${limit}&page=${page}`;
    if (name) {
      url += `&search=${name}`;
    }
    return this.apiService.get<HourListResponse>(url).pipe(
      debounceTime(600),
      map((response: HourListResponse) => {
        this.updateHours(response.data);
        this.updateTotalHours(response.paginate.total);
      }),
    );
  }

  getList(): Observable<Hour[]> {
    return this.hours$.asObservable();
  }

  getTotal(): Observable<number> {
    return this.total$.asObservable();
  }

  getOne(id: number): Observable<Hour> {
    return this.apiService.get(`rate-hours/${id}`);
  }

  create(data: Hour): Observable<void> {
    return this.apiService
      .post('rate-hours', data)
      .pipe(switchMap(() => this.callGetList()));
  }

  edit(id: number, data: Hour): Observable<void> {
    return this.apiService
      .patch(`rate-hours/${id}`, data)
      .pipe(switchMap(() => this.callGetList()));
  }

  delete(id: number): Observable<void> {
    return this.apiService
      .delete(`rate-hours/${id}`)
      .pipe(switchMap(() => this.callGetList()));
  }

  private updateHours(value: Hour[]): void {
    this.hours = value;
    this.hours$.next(this.hours);
  }

  private updateTotalHours(value: number): void {
    this.total = value;
    this.total$.next(this.total);
  }
}
