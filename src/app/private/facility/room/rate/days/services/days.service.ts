import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  debounceTime,
  map,
  Observable,
  switchMap,
} from 'rxjs';
import { Day, DayListResponse } from '../models/days.model';
import { ApiService } from '../../../../../../services/api.service';

@Injectable({
  providedIn: 'root',
})
export class DaysService {
  days: Day[] = [];
  total: number = 0;
  days$: BehaviorSubject<Day[]> = new BehaviorSubject<Day[]>(this.days);
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  constructor(private readonly apiService: ApiService) {}

  callGetList(
    limit: number = 10,
    page: number = 1,
    name: string = '',
  ): Observable<void> {
    let url = `rate-days?limit=${limit}&page=${page}`;
    if (name) {
      url += `&search=${name}`;
    }
    return this.apiService.get<DayListResponse>(url).pipe(
      debounceTime(600),
      map((response: DayListResponse) => {
        this.updateDays(response.data);
        this.updateTotalDays(response.paginate.total);
      }),
    );
  }

  getList(): Observable<Day[]> {
    return this.days$.asObservable();
  }

  getTotal(): Observable<number> {
    return this.total$.asObservable();
  }

  getOne(id: number): Observable<Day> {
    return this.apiService.get(`rate-days/${id}`);
  }

  create(data: Day): Observable<void> {
    return this.apiService
      .post('rate-days', data)
      .pipe(switchMap(() => this.callGetList()));
  }

  edit(id: number, data: Day): Observable<void> {
    return this.apiService
      .patch(`rate-days/${id}`, data)
      .pipe(switchMap(() => this.callGetList()));
  }

  delete(id: number): Observable<void> {
    return this.apiService
      .delete(`rate-days/${id}`)
      .pipe(switchMap(() => this.callGetList()));
  }

  private updateDays(value: Day[]): void {
    this.days = value;
    this.days$.next(this.days);
  }

  private updateTotalDays(value: number): void {
    this.total = value;
    this.total$.next(this.total);
  }
}
