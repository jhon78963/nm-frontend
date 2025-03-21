import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  debounceTime,
  map,
  Observable,
  switchMap,
} from 'rxjs';

import { Rate, RateListResponse } from '../models/rates.model';

import { ApiService } from '../../../../../../services/api.service';

@Injectable({
  providedIn: 'root',
})
export class RatesService {
  rates: Rate[] = [];
  total: number = 0;
  rates$: BehaviorSubject<Rate[]> = new BehaviorSubject<Rate[]>(this.rates);
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  constructor(private readonly apiService: ApiService) {}

  callGetList(
    limit: number = 10,
    page: number = 1,
    name: string = '',
  ): Observable<void> {
    let url = `rates?limit=${limit}&page=${page}`;
    if (name) {
      url += `&search=${name}`;
    }
    return this.apiService.get<RateListResponse>(url).pipe(
      debounceTime(600),
      map((response: RateListResponse) => {
        this.updateRates(response.data);
        this.updateTotalRates(response.paginate.total);
      }),
    );
  }

  getList(): Observable<Rate[]> {
    return this.rates$.asObservable();
  }

  getTotal(): Observable<number> {
    return this.total$.asObservable();
  }

  getOne(id: number): Observable<Rate> {
    return this.apiService.get(`rates/${id}`);
  }

  create(data: Rate): Observable<void> {
    return this.apiService
      .post('rates', data)
      .pipe(switchMap(() => this.callGetList()));
  }

  edit(id: number, data: Rate): Observable<void> {
    return this.apiService
      .patch(`rates/${id}`, data)
      .pipe(switchMap(() => this.callGetList()));
  }

  delete(id: number): Observable<void> {
    return this.apiService
      .delete(`rates/${id}`)
      .pipe(switchMap(() => this.callGetList()));
  }

  private updateRates(value: Rate[]): void {
    this.rates = value;
    this.rates$.next(this.rates);
  }

  private updateTotalRates(value: number): void {
    this.total = value;
    this.total$.next(this.total);
  }
}
